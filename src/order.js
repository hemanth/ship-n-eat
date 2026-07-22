import * as core from '@actions/core';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function installDdCli() {
  core.info('Installing dd-cli...');
  // Mock installation for demonstration
  try {
    // e.g. await execAsync('curl -sL https://doordash.com/cli/install.sh | bash');
    core.info('dd-cli installed successfully (mock).');
  } catch (error) {
    core.warning(`Failed to install dd-cli: ${error.message}`);
  }
}

export async function selectRestaurant(config) {
  const restaurants = config.restaurants || [];
  if (restaurants.length === 0) return null;
  // Simple random selection
  const selected = restaurants[Math.floor(Math.random() * restaurants.length)];
  core.info(`Selected restaurant: ${selected.name || selected.storeId}`);
  return selected;
}

export async function selectItems(storeId, budget, config) {
  core.info(`Selecting items from store ${storeId} with budget $${budget}...`);
  // Mock item selection respecting dietary filters and budget
  return [
    { id: 'item-1', name: 'Celebration Cake', price: 25.00, quantity: 1 },
    { id: 'item-2', name: 'Party Pizza', price: 20.00, quantity: 1 }
  ].filter(item => item.price <= budget);
}

export async function placeOrder(storeId, items) {
  core.info(`Placing order at store ${storeId} for ${items.length} items...`);
  // Mock CLI execution
  // const cmd = `dd-cli order create --store ${storeId} --items ${items.map(i => i.id).join(',')}`;
  // const { stdout } = await execAsync(cmd);
  
  return {
    orderId: 'DD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    status: 'submitted',
    items: items,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  };
}

export async function dryRun(storeId, items) {
  core.info(`Dry run: order at store ${storeId} for ${items.length} items.`);
  return {
    orderId: 'DRY-RUN',
    status: 'preview',
    items: items,
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  };
}
