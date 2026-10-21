import { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "../lib/api";

// Renders PayPal Smart Buttons (PayPal + card). Falls back to a notice when not configured.
export const PayPalCheckout = ({ buildPayload, onSuccess, disabled }) => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    api
      .get("/paypal/config")
      .then((r) => setConfig(r.data))
      .catch(() => setConfig({ configured: false }));
  }, []);

  if (!config) {
    return (
      <div className="flex justify-center py-6" data-testid="paypal-loading">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--thermo)" }} />
      </div>
    );
  }

  if (!config.configured) {
    return (
      <div
        className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-300"
        data-testid="paypal-not-configured"
      >
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        PayPal isn't configured yet. Add your PayPal Client ID &amp; Secret to enable live buttons.
      </div>
    );
  }

  return (
    <div data-testid="paypal-buttons" className={disabled ? "pointer-events-none opacity-50" : ""}>
      <PayPalScriptProvider
        options={{
          clientId: config.client_id,
          currency: config.currency || "USD",
          components: "buttons",
          "enable-funding": "card",
          intent: "capture",
        }}
      >
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={async () => {
            const { data } = await api.post("/paypal/create-order", buildPayload());
            return data.id;
          }}
          onApprove={async (data) => {
            try {
              const { data: order } = await api.post(`/paypal/capture/${data.orderID}`);
              onSuccess(order);
            } catch (err) {
              toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Payment capture failed");
            }
          }}
          onError={() => toast.error("PayPal encountered an error. Please try again.")}
        />
      </PayPalScriptProvider>
    </div>
  );
};
