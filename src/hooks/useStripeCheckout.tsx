import { useCallback, useState } from "react";
import { StripeEmbeddedCheckoutForm } from "@/components/payments/StripeEmbeddedCheckout";

interface CheckoutOptions {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((o: CheckoutOptions) => {
    setOpts(o);
    setIsOpen(true);
  }, []);
  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOpts(null);
  }, []);

  const checkoutElement =
    isOpen && opts ? <StripeEmbeddedCheckoutForm {...opts} /> : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
