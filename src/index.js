import * as core from '@actions/core';
import * as github from '@actions/github';
import { loadConfig } from './config.js';
import { authenticate } from './auth.js';
import { detectOccasion } from './occasions.js';
import { installDdCli, selectRestaurant, selectItems, placeOrder, dryRun } from './order.js';
import { postComment } from './notify.js';

async function run() {
  try {
    const token = core.getInput('github-token') || process.env.GITHUB_TOKEN;
    if (!token) {
      core.setFailed('github-token is required');
      return;
    }
    const octokit = github.getOctokit(token);
    const context = github.context;

    const config = await loadConfig(octokit, context);
    if (!config) {
      core.info('No ship-n-eat configuration found or valid. Skipping.');
      return;
    }

    const occasion = await detectOccasion(octokit, context, config);
    if (!occasion) {
      core.info('No celebration occasion detected for this event.');
      return;
    }

    core.info(`Detected celebration occasion: ${occasion.occasion}`);

    const authSuccess = await authenticate();
    if (!authSuccess) {
      core.setFailed('Failed to authenticate with DoorDash CLI');
      return;
    }

    await installDdCli();

    const restaurant = await selectRestaurant(config);
    if (!restaurant) {
      core.warning('No restaurant selected. Skipping order.');
      return;
    }

    const items = await selectItems(restaurant.storeId, occasion.budget, config);
    if (!items || items.length === 0) {
      core.warning('No items selected within budget. Skipping order.');
      return;
    }

    let orderDetails;
    if (config.dryRun) {
      core.info('Dry run enabled. Simulating order.');
      orderDetails = await dryRun(restaurant.storeId, items);
    } else {
      core.info('Placing order...');
      orderDetails = await placeOrder(restaurant.storeId, items);
    }

    if (orderDetails) {
      await postComment(octokit, context, occasion, { ...orderDetails, restaurant });
      core.info('Celebration complete!');
    } else {
      core.warning('Failed to place order.');
    }

  } catch (error) {
    core.setFailed(`Action failed with error: ${error.message}`);
  }
}

run();
