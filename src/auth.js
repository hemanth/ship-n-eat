import * as core from '@actions/core';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export async function authenticate() {
  try {
    const tokenSecret = process.env.DD_CLI_TOKEN;
    const email = process.env.DD_CLI_EMAIL;
    const password = process.env.DD_CLI_PASSWORD;

    let authData;

    if (tokenSecret) {
      core.info('Using DD_CLI_TOKEN for authentication.');
      authData = JSON.parse(tokenSecret);
      
      if (authData.expires_at) {
        const expiry = new Date(authData.expires_at);
        if (expiry < new Date()) {
          core.warning('DoorDash CLI token has expired!');
          return false;
        } else if (expiry < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
          core.warning('DoorDash CLI token will expire within 24 hours.');
        }
      }
    } else if (email && password) {
      core.info('Using email/password for authentication (simulated API call).');
      // In a real app, this would hit the DoorDash identity API
      authData = {
        access_token: 'mock-token-from-creds',
        token_type: 'Bearer',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };
    } else {
      core.warning('No DoorDash credentials provided. Set DD_CLI_TOKEN or DD_CLI_EMAIL/PASSWORD secrets.');
      return false;
    }

    const ddCliDir = path.join(os.homedir(), '.dd-cli');
    await fs.mkdir(ddCliDir, { recursive: true });
    
    // Write token to keyring file backend
    const keyFile = path.join(ddCliDir, 'credentials.json');
    await fs.writeFile(keyFile, JSON.stringify(authData, null, 2), 'utf-8');
    core.info('Authentication credentials stored successfully.');
    
    return true;
  } catch (error) {
    core.error(`Authentication error: ${error.message}`);
    return false;
  }
}
