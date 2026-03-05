export type AnalyticsEventMap = {
  landing_view: {
    market: "AR";
    path: string;
  };
  landing_cta_click: {
    cta_id: string;
    section: string;
  };
  wizard_step_view: {
    step_id: number;
    step_name: string;
    is_gift: boolean;
  };
  wizard_step_completed: {
    step_id: number;
    step_name: string;
  };
  wizard_step_blocked: {
    step_id: number;
    reason: string;
  };
  preview_generated: {
    story_id: string;
    style_id: string;
  };
  checkout_started: {
    format: "digital" | "print";
    currency: "USD" | "ARS";
    total_estimate: number;
  };
  checkout_redirected: {
    provider: "stripe" | "mercadopago";
  };
  checkout_error: {
    message: string;
  };
  auth_redirect_required: {
    from: "checkout";
  };
  shipping_quote_generated: {
    format: "digital" | "print";
    has_shipping: boolean;
    shipping_fee: number;
  };
  contact_submitted: {
    source: "contact_form";
  };
  stickers_waitlist_joined: {
    source: "stickers_page";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;
export type AnalyticsEventProps<T extends AnalyticsEventName> =
  AnalyticsEventMap[T];
