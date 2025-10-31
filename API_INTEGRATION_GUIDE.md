
# now.gg API Integration Guide

## Current Issues

1. **DNS Resolution Failure**: The endpoint `api.now.gg` is not resolving (ENOTFOUND error)
2. **Authentication**: The now.gg API likely requires proper authentication tokens or API keys
3. **IP Whitelisting**: The API may only be accessible from whitelisted IP addresses

## Based on now.gg API Documentation

According to the Verify Token API documentation, here's what you need:

### Required Headers
- `Content-Type: application/json`
- `Authorization: Bearer <API_KEY>` (if required)
- `X-API-Key: <YOUR_API_KEY>` (if using API key authentication)

### Request Format
```json
POST /user/v2/auth
{
  "appId": "5349",
  "token": "base64_encoded_token",
  "sessionId": "unique_session_id",
  "recaptchaToken": "recaptcha_token",
  "adTrackingId": "tracking_id" 
}
```
### ad tracking from now.gg u dont need that bc ads and tracking with out consent is breach of privacy

### Expected Response
```json
{
  "success": true,
  "data": {
    "userId": "string",
    "sessionToken": "string",
    "expiresAt": "timestamp"
  }
}
```

## Steps to Get API Access

1. **Contact now.gg Developer Support**
   - Email: developer-support@now.gg
   - Request API credentials and documentation
   - Ask about IP whitelisting requirements

2. **Obtain API Credentials**
   - API Key or Client ID
   - API Secret or Client Secret
   - Valid authentication tokens

3. **Test with Replit Secrets**
   Once you have credentials, store them securely using Replit Secrets:
   - Click on "Tools" → "Secrets"
   - Add: `NOWGG_API_KEY`
   - Add: `NOWGG_API_SECRET`

## Alternative Approach

Since the public API may not be accessible, consider these options:

1. **Official SDK**: Check if now.gg provides an official SDK
2. **Partner Integration**: Apply for official partnership with now.gg
3. **Mock Implementation**: Create a mock API for development/testing

## Testing the API

Run the test script to check endpoint availability:
```bash
node api-test.js
```

## Important Notes

- The current error suggests the API is not publicly accessible
- You likely need to be an official now.gg partner to access their APIs
- Consider reaching out to now.gg business development team
- The static site will work for UI demonstration, but won't connect to actual games without API access

## Next Steps

1. Contact now.gg for API access
2. Once you have credentials, update the server to use proper authentication
3. Store sensitive credentials in Replit Secrets
4. Test with the improved proxy endpoint
