local cursor = '0'
local result = {}
repeat
  local page = redis.call('SCAN', cursor, 'MATCH', 'asteroids:sess:*', 'COUNT', 100)
  cursor = page[1]
  for _, key in ipairs(page[2]) do
    local raw = redis.call('GET', key)
    if raw then
      local ok, session = pcall(cjson.decode, raw)
      if ok and session.observer then
        table.insert(result, cjson.encode({key=key, userId=session.observer.id, email=session.observer.email, fullName=session.observer.fullName, ttl=redis.call('TTL', key)}))
      end
    end
  end
until cursor == '0'
return result
