// Atomic Lua Scripts for Concurrency Control and Race Prevention

/**
 * Atomic Reservation Script
 * Keys:
 *   KEYS[1] - food:{foodId} hash
 *   KEYS[2] - food:by-status:AVAILABLE set
 *   KEYS[3] - food:by-status:RESERVED set
 *   KEYS[4] - reservations:{resId} hash
 *   KEYS[5] - reservations:all set
 *   KEYS[6] - reservations:by-listing:{foodId} set
 *   KEYS[7] - reservations:by-recipient:{recipientId} set
 *   KEYS[8] - reservations:by-status:PENDING set
 *   KEYS[9] - idempotency:{key}
 *
 * ARGV:
 *   ARGV[1] - requested quantity (number)
 *   ARGV[2] - current timestamp in epoch seconds (for expiration check)
 *   ARGV[3] - reservation JSON payload or hash fields
 *   ARGV[4] - reservation ID
 *   ARGV[5] - idempotency key (if empty, skip check)
 *   ARGV[6] - idempotency TTL seconds (e.g. 86400)
 */
export const ATOMIC_RESERVE_SCRIPT = `
-- Check idempotency if key provided
if ARGV[5] ~= "" then
  local existingResId = redis.call("GET", KEYS[9])
  if existingResId then
    return {1, "IDEMPOTENT_SUCCESS", existingResId}
  end
end

-- 1. Check if food listing exists
if redis.call("EXISTS", KEYS[1]) == 0 then
  return {-1, "FOOD_NOT_FOUND"}
end

-- 2. Verify status is AVAILABLE
local status = redis.call("HGET", KEYS[1], "status")
if status ~= "AVAILABLE" then
  return {-2, "FOOD_NOT_AVAILABLE"}
end

-- 3. Verify expiration
local expTime = tonumber(redis.call("HGET", KEYS[1], "expirationTimeEpoch") or "0")
local nowEpoch = tonumber(ARGV[2])
if expTime > 0 and expTime <= nowEpoch then
  return {-3, "FOOD_EXPIRED"}
end

-- 4. Check available quantity
local currentQty = tonumber(redis.call("HGET", KEYS[1], "quantity") or "0")
local requestedQty = tonumber(ARGV[1])

if requestedQty <= 0 then
  return {-4, "INVALID_QUANTITY"}
end

if currentQty < requestedQty then
  return {-5, "INSUFFICIENT_QUANTITY", tostring(currentQty)}
end

-- 5. Decrease available quantity atomically
local remainingQty = currentQty - requestedQty
redis.call("HSET", KEYS[1], "quantity", tostring(remainingQty))

-- If all quantity is claimed, update listing status to RESERVED
if remainingQty == 0 then
  redis.call("HSET", KEYS[1], "status", "RESERVED")
  redis.call("SREM", KEYS[2], ARGV[7]) -- remove foodId from food:by-status:AVAILABLE
  redis.call("SADD", KEYS[3], ARGV[7]) -- add foodId to food:by-status:RESERVED
end

-- 6. Save reservation hash (serialized JSON in 'data' field + indexed fields)
local resId = ARGV[4]
redis.call("HSET", KEYS[4], "data", ARGV[3])
redis.call("SADD", KEYS[5], resId)
redis.call("SADD", KEYS[6], resId)
redis.call("SADD", KEYS[7], resId)
redis.call("SADD", KEYS[8], resId)

-- Record idempotency if requested
if ARGV[5] ~= "" then
  redis.call("SET", KEYS[9], resId, "EX", tonumber(ARGV[6]))
end

return {0, "SUCCESS", resId, tostring(remainingQty)}
`;

/**
 * Atomic Reservation Cancellation Script
 * Keys:
 *   KEYS[1] - reservations:{resId} hash
 *   KEYS[2] - food:{foodId} hash
 *   KEYS[3] - food:by-status:AVAILABLE set
 *   KEYS[4] - food:by-status:RESERVED set
 *   KEYS[5] - reservations:by-status:PENDING set
 *   KEYS[6] - reservations:by-status:CANCELLED set
 *
 * ARGV:
 *   ARGV[1] - resId
 *   ARGV[2] - foodId
 *   ARGV[3] - cancelledAt timestamp
 *   ARGV[4] - cancellation actor userId
 *   ARGV[5] - actor role ('ADMIN' or recipientId)
 */
export const ATOMIC_CANCEL_RESERVATION_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 0 then
  return {-1, "RESERVATION_NOT_FOUND"}
end

local resDataRaw = redis.call("HGET", KEYS[1], "data")
if not resDataRaw then
  return {-1, "RESERVATION_DATA_EMPTY"}
end

local resData = cjson.decode(resDataRaw)

-- Check if already cancelled or completed
if resData["status"] == "CANCELLED" then
  return {-2, "ALREADY_CANCELLED"}
end

if resData["status"] == "COMPLETED" or resData["status"] == "PICKED_UP" then
  return {-3, "CANNOT_CANCEL_IN_PROGRESS_OR_COMPLETED"}
end

-- Authorization check: must be the recipient or ADMIN
if ARGV[5] ~= "ADMIN" and resData["recipientId"] ~= ARGV[4] then
  return {-4, "UNAUTHORIZED"}
end

local returnQty = tonumber(resData["quantity"] or "0")

-- Update reservation status
resData["status"] = "CANCELLED"
resData["cancelledAt"] = ARGV[3]
resData["cancelledBy"] = ARGV[4]
redis.call("HSET", KEYS[1], "data", cjson.encode(resData))

redis.call("SREM", KEYS[5], ARGV[1])
redis.call("SADD", KEYS[6], ARGV[1])

-- Restore food listing quantity if food listing still exists
if redis.call("EXISTS", KEYS[2]) == 1 then
  local currentFoodQty = tonumber(redis.call("HGET", KEYS[2], "quantity") or "0")
  local newFoodQty = currentFoodQty + returnQty
  redis.call("HSET", KEYS[2], "quantity", tostring(newFoodQty))
  
  -- Restore food status to AVAILABLE if it was RESERVED
  local foodStatus = redis.call("HGET", KEYS[2], "status")
  if foodStatus == "RESERVED" and newFoodQty > 0 then
    redis.call("HSET", KEYS[2], "status", "AVAILABLE")
    redis.call("SREM", KEYS[4], ARGV[2])
    redis.call("SADD", KEYS[3], ARGV[2])
  end
end

return {0, "SUCCESS", tostring(returnQty)}
`;

/**
 * Atomic Safe Release Lock Script
 * Releases a lock only if the token matches the caller's token.
 */
export const ATOMIC_RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

/**
 * Atomic Pickup Claim Script
 * Prevents multiple volunteers from claiming the same pickup task simultaneously.
 * Keys:
 *   KEYS[1] - pickups:{pickupId} hash
 *   KEYS[2] - pickups:available set
 *   KEYS[3] - pickups:by-volunteer:{volunteerId} set
 *   KEYS[4] - pickups:by-status:AVAILABLE set
 *   KEYS[5] - pickups:by-status:ACCEPTED set
 *
 * ARGV:
 *   ARGV[1] - pickupId
 *   ARGV[2] - volunteerId
 *   ARGV[3] - volunteerName
 *   ARGV[4] - acceptedAt timestamp
 */
export const ATOMIC_CLAIM_PICKUP_SCRIPT = `
if redis.call("EXISTS", KEYS[1]) == 0 then
  return {-1, "PICKUP_NOT_FOUND"}
end

local pickupRaw = redis.call("HGET", KEYS[1], "data")
if not pickupRaw then
  return {-1, "PICKUP_DATA_MISSING"}
end

local pickup = cjson.decode(pickupRaw)

if pickup["status"] ~= "AVAILABLE" or pickup["volunteerId"] ~= nil and pickup["volunteerId"] ~= "" then
  return {-2, "PICKUP_ALREADY_CLAIMED"}
end

-- Claim task
pickup["status"] = "ACCEPTED"
pickup["volunteerId"] = ARGV[2]
pickup["volunteerName"] = ARGV[3]
pickup["acceptedAt"] = ARGV[4]
pickup["updatedAt"] = ARGV[4]

redis.call("HSET", KEYS[1], "data", cjson.encode(pickup))

-- Update indexes
redis.call("SREM", KEYS[2], ARGV[1])
redis.call("SADD", KEYS[3], ARGV[1])
redis.call("SREM", KEYS[4], ARGV[1])
redis.call("SADD", KEYS[5], ARGV[1])

return {0, "SUCCESS", cjson.encode(pickup)}
`;
