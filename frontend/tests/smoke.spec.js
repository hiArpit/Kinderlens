import { expect, test } from '@playwright/test';

const wonderItems = {
  success: true,
  items: [
    { slug: 'moon', name: 'Moon', emoji: '🌙', category: 'Space' },
    { slug: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'Nature' },
  ],
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/account/profiles', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'PARENT_AUTH_REQUIRED' }) });
  });
  await page.route('**/api/wonder-list', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(wonderItems) });
  });
});

test('child view shows safe discovery controls without account fields', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'KinderLens' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wonder List' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Moon.*Explore/ })).toBeVisible();
  await expect(page.getByText('Parent area')).toBeVisible();
  await expect(page.getByLabel('Parent email')).toHaveCount(0);
  await expect(page.getByLabel('Parent password')).toHaveCount(0);
});

test('parent area exposes account setup only after entering the parent area', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Parent area' }).click();

  await expect(page.getByRole('heading', { name: 'Parent Area' })).toBeVisible();
  await expect(page.getByLabel('Parent email')).toBeVisible();
  await expect(page.getByLabel('Parent password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create a new parent account' })).toBeVisible();
});

test('parent account setup creates a session and shows child profile controls', async ({ page }) => {
  let profileCreated = false;
  await page.route('**/api/account/register', async (route) => {
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, email: 'parent@example.com' }) });
  });
  await page.route('**/api/history**', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, history: [] }) });
  });
  await page.route('**/api/account/profiles', async (route) => {
    if (route.request().method() === 'POST') {
      profileCreated = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, profile: { _id: 'child-1', name: 'Aarav', age: 7 } }),
      });
      return;
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ success: true, profiles: profileCreated ? [{ _id: 'child-1', name: 'Aarav', age: 7 }] : [] }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Parent area' }).click();
  await page.getByRole('button', { name: 'Create a new parent account' }).click();
  await page.getByLabel('Parent email').fill('parent@example.com');
  await page.getByLabel('Parent password').fill('safe-password');
  await page.getByRole('button', { name: 'Create parent account' }).click();

  await expect(page.getByText('Set up a child profile')).toBeVisible();
  await page.getByRole('button', { name: 'Create child profile' }).click();
  await page.getByLabel('Child name').fill('Aarav');
  await page.getByLabel('Child age').fill('7');
  await page.getByRole('button', { name: 'Add child' }).click();
  await expect(page.getByText('Child profile created.')).toBeVisible();
});

test('discovery map progresses through four related Rainbow topics', async ({ page }) => {
  await page.route('**/api/wonder-list/rainbow/explore', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        identified: true,
        objectName: 'Rainbow',
        kidSummary: 'A rainbow appears when light meets water drops.',
        language: 'english',
        grounding: { grounded: true, source_title: 'Rainbow' },
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /Rainbow.*Explore/ }).click();
  await expect(page.getByText('Stage 1 of 4')).toBeVisible();

  await page.getByRole('button', { name: 'Open Weather learning connection' }).click();
  await expect(page.getByText('Stage 2 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Open Rain learning connection' }).click();
  await expect(page.getByText('Stage 3 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Open Clouds learning connection' }).click();
  await expect(page.getByText('Stage 4 of 4')).toBeVisible();
  await expect(page.getByText('Rainbow → Weather → Rain → Clouds')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();

  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Stage 3 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Start a new trail' }).click();
  await expect(page.getByText('Your map starts with a question')).toBeVisible();
});
