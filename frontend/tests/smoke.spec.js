import { expect, test } from '@playwright/test';

const wonderItems = {
  success: true,
  items: [
    { slug: 'moon', name: 'Moon', emoji: '🌙', category: 'Space' },
    { slug: 'rainbow', name: 'Rainbow', emoji: '🌈', category: 'Nature' },
  ],
};

async function visitHome(page) {
  await page.goto('/');
  const skipTour = page.getByRole('button', { name: 'Skip tour' });
  if (await skipTour.isVisible().catch(() => false)) await skipTour.click();
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/account/profiles', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'PARENT_AUTH_REQUIRED' }) });
  });
  await page.route('**/api/wonder-list', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(wonderItems) });
  });
});

test('first-visit guide can be skipped, replayed, and stays dismissed on later visits', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ready to explore?' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Choose how to begin' })).toBeVisible();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: 'Follow a new idea' })).toBeVisible();
  await page.getByRole('button', { name: 'Let’s explore!' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Skip tour' }).click();
  await page.reload();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('camera permission is requested only after the child chooses to turn on the camera', async ({ page }) => {
  await page.addInitScript(() => {
    window.__cameraRequestCount = 0;
    if (!navigator.mediaDevices) return;
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        window.__cameraRequestCount += 1;
        const error = new Error('Camera permission denied for test');
        error.name = 'NotAllowedError';
        throw error;
      },
    });
  });
  await visitHome(page);

  expect(await page.evaluate(() => window.__cameraRequestCount)).toBe(0);
  await page.getByRole('button', { name: 'Turn on camera' }).click();
  await expect(page.getByText('Camera permission was denied. Allow camera access in browser settings, then try again.')).toBeVisible();
  expect(await page.evaluate(() => window.__cameraRequestCount)).toBe(1);
});

test('World Explorer pins show sourced discoveries and category filters', async ({ page }) => {
  await visitHome(page);
  await expect(page.getByRole('heading', { name: 'World Explorer' })).toBeVisible();
  await page.getByRole('button', { name: 'Explore Fennec fox in Sahara Desert, North Africa' }).click();
  await expect(page.getByRole('heading', { name: 'Fennec fox' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Source: Smithsonian’s National Zoo/ })).toBeVisible();

  await page.getByLabel('Learning language').selectOption('hindi');
  await expect(page.getByRole('heading', { name: 'दुनिया की खोज' })).toBeVisible();
  await page.getByRole('button', { name: 'सहारा रेगिस्तान, उत्तर अफ्रीका में फेनेक लोमड़ी देखो' }).click();
  await expect(page.getByText(/फेनेक लोमड़ी सहारा में रहती है/)).toBeVisible();

  await page.getByRole('button', { name: 'जीवाश्म', exact: true }).click();
  await expect(page.locator('.world-map-marker')).toHaveCount(1);
  await page.getByRole('button', { name: 'यूटा, संयुक्त राज्य में डायनासोर के जीवाश्म देखो' }).click();
  await expect(page.getByText(/असली डायनासोर की हड्डियाँ आज भी दिखाई देती हैं/)).toBeVisible();
});

test('child view shows safe discovery controls without account fields', async ({ page }) => {
  await visitHome(page);

  await expect(page.getByRole('heading', { name: 'KinderLens' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wonder List' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Moon.*Explore/ })).toBeVisible();
  await expect(page.getByText('Parent area')).toBeVisible();
  await expect(page.getByLabel('Parent email')).toHaveCount(0);
  await expect(page.getByLabel('Parent password')).toHaveCount(0);
});

test('parent area exposes account setup only after entering the parent area', async ({ page }) => {
  await visitHome(page);
  await page.getByRole('button', { name: 'Parent area' }).click();

  await expect(page.getByRole('heading', { name: 'Parent Area' })).toBeVisible();
  await expect(page.getByLabel('Parent email')).toBeVisible();
  await expect(page.getByLabel('Parent password')).toBeVisible();
  await expect(page.getByLabel('Parent PIN')).toHaveCount(0);
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

  await visitHome(page);
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
        success: true,
        identified: true,
        objectName: 'Rainbow',
        kidSummary: 'A rainbow appears when light meets water drops.',
        language: 'english',
        grounding: { grounded: true, source_title: 'Rainbow' },
      }),
    });
  });

  await visitHome(page);
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

test('KinderLens logo returns from a discovery result to the home page', async ({ page }) => {
  await page.route('**/api/wonder-list/rainbow/explore', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        identified: true,
        objectName: 'Rainbow',
        kidSummary: 'A rainbow appears when light meets water drops.',
        language: 'english',
      }),
    });
  });

  await visitHome(page);
  await page.getByRole('button', { name: /Rainbow.*Explore/ }).click();
  await expect(page.getByRole('heading', { name: 'Rainbow' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Discovery Map' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to KinderLens home' }).click();
  await expect(page.getByRole('heading', { name: 'Wonder List' })).toBeVisible();
  await expect(page.getByText('What will we discover today?')).toBeVisible();
});

test('discovery map gives a captured object a four-stage trail', async ({ page }) => {
  await page.route('**/api/capture/upload', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        identified: true,
        objectName: 'Chair',
        kidSummary: 'A chair is made for sitting.',
        language: 'english',
      }),
    });
  });

  await visitHome(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'chair.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('captured-object-fixture'),
  });
  await page.getByRole('button', { name: 'Explore this object' }).click();

  await expect(page.getByText('Stage 1 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Open Parts learning connection' }).click();
  await expect(page.getByText('Stage 2 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Open Shape learning connection' }).click();
  await expect(page.getByText('Stage 3 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Open Patterns learning connection' }).click();
  await expect(page.getByText('Stage 4 of 4')).toBeVisible();
  await expect(page.getByText('Chair → Parts → Shape → Patterns')).toBeVisible();
});
