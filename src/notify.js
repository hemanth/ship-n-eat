import * as core from '@actions/core';

export async function postComment(octokit, context, occasion, orderDetails) {
  try {
    const { repo, eventName, payload } = context;
    
    let issueNumber;
    if (eventName === 'pull_request') {
      issueNumber = payload.pull_request.number;
    } else if (eventName === 'issues') {
      issueNumber = payload.issue.number;
    }

    const restaurantName = orderDetails.restaurant.name || orderDetails.restaurant.storeId;
    const itemsList = orderDetails.items.map(item => `- ${item.quantity}x ${item.name} ($${item.price.toFixed(2)})`).join('\n');
    
    const body = `### Celebration Time!\n\n${occasion.message}\n\nTo celebrate, we've ordered some food from **${restaurantName}**:\n\n${itemsList}\n\n**Total Estimated Cost:** $${orderDetails.total.toFixed(2)}\n**Order ID:** \`${orderDetails.orderId}\``;

    if (issueNumber) {
      core.info(`Posting comment to issue/PR #${issueNumber}`);
      await octokit.rest.issues.createComment({
        owner: repo.owner,
        repo: repo.repo,
        issue_number: issueNumber,
        body
      });
    } else if (eventName === 'release') {
      core.info(`Release ${occasion.meta.tagName} triggered celebration. Note: Commenting on releases not natively supported here, skipping comment.`);
    } else {
      core.info(`No specific issue/PR to comment on for event ${eventName}.`);
    }
  } catch (error) {
    core.error(`Failed to post notification: ${error.message}`);
  }
}
