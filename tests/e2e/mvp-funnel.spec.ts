import path from "path";
import { expect, test, type Page } from "@playwright/test";

async function mockPersonalizeApi(page: Page) {
  await page.route("**/api/personalize", async (route) => {
    const payload = route.request().postDataJSON() as { action?: string };
    if (payload?.action === "analyze") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          features: {
            approximateAge: 7,
            gender: "niño",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        imageUrl: "/stories/space-1.jpg",
        sceneText: "Vista previa de prueba",
      }),
    });
  });
}

async function completeWizardUntilPreview(page: Page) {
  const imagePath = path.resolve(process.cwd(), "tests/fixtures/child.png");
  await page.setInputFiles('input[type="file"]', imagePath);

  await page.getByRole("button", { name: "Siguiente Paso" }).click();
  await page.getByPlaceholder("Ej: Lucas, Sofía...").fill("Santi");
  await page.getByRole("button", { name: "Siguiente Paso" }).click();
  await page.getByText("El Explorador Espacial", { exact: false }).click();
  await page.getByRole("button", { name: "Ver Resultado Mágico" }).click();

  await expect(page.getByText("Tu cuento", { exact: false })).toBeVisible();
}

test("home hero CTA navigates to /crear on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("link", { name: /Crear Cuento Ahora/i }).click();
  await expect(page).toHaveURL(/\/crear/);
  await expect(page.getByRole("button", { name: "Siguiente Paso" })).toBeVisible();
});

test("smoke mvp funnel with mocked backend", async ({ page, baseURL }) => {
  await mockPersonalizeApi(page);

  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        order_id: "11111111-1111-1111-1111-111111111111",
        status: "draft",
      }),
    });
  });

  await page.route("**/api/orders/quote", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        quote_id: "22222222-2222-2222-2222-222222222222",
        subtotal: 10000,
        shipping_fee: 2500,
        total: 12500,
        fx_rate_snapshot: 1200,
        expires_at: "2026-03-03T12:00:00.000Z",
        currency: "ARS",
      }),
    });
  });

  await page.route("**/api/checkout/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        checkout_url: `${baseURL}/success`,
        session_id: "cs_test_mock",
      }),
    });
  });

  await page.goto("/crear");
  await completeWizardUntilPreview(page);

  await page.getByRole("button", { name: "Solo Digital" }).click();
  await page.getByRole("button", { name: /Pagar/ }).click();
  await page.waitForURL("**/success");
  await expect(page.getByText("¡Magia en camino!")).toBeVisible();
});

test("redirects to login when checkout requires auth", async ({ page }) => {
  await mockPersonalizeApi(page);

  await page.route("**/api/orders", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Unauthorized" }),
    });
  });

  await page.goto("/crear");
  await completeWizardUntilPreview(page);

  await page.getByRole("button", { name: "Solo Digital" }).click();
  await page.getByRole("button", { name: /Pagar/ }).click();
  await expect(page).toHaveURL(/\/login\?next=/);
});


test("seo endpoints and security headers are exposed", async ({ page, request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toContain("User-agent");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("<urlset");

  const home = await page.goto("/");
  expect(home).not.toBeNull();
  expect(home?.headers()["x-frame-options"]).toBe("DENY");
  expect(home?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home?.headers()["content-security-policy"]).toContain("default-src 'self'");
});
