import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, CreditCard, AlertCircle, TestTube } from 'lucide-react';
import { PAYPAL_CLIENT_ID, PAYPAL_SANDBOX } from '@/config/pricing';
import { Button } from '@/components/ui/button';

interface PayPalButtonProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

const PayPalButton = ({ amount, onSuccess, onError, onCancel }: PayPalButtonProps) => {
  const paypalRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buttonsRendered, setButtonsRendered] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  
  // Store callbacks in ref to prevent re-renders breaking PayPal buttons
  const callbacksRef = useRef({ onSuccess, onError, onCancel });
  callbacksRef.current = { onSuccess, onError, onCancel };

  const loadScript = useCallback(() => {
    // Check if window.paypal already exists
    if (window.paypal) {
      console.log('PayPal SDK already available');
      setScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    // Check if script already exists
    const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    
    if (existingScript) {
      // Script exists but SDK not ready, wait for it
      const checkPaypal = setInterval(() => {
        if (window.paypal) {
          clearInterval(checkPaypal);
          setScriptLoaded(true);
          setIsLoading(false);
        }
      }, 100);
      
      // Timeout after 20 seconds
      setTimeout(() => {
        clearInterval(checkPaypal);
        if (!window.paypal) {
          console.warn('PayPal SDK timeout - enabling simulation mode');
          setError('מערכת התשלום לא נטענה. ייתכן שחוסם פרסומות מפריע לטעינה.');
          setSimulationMode(true);
          setIsLoading(false);
        }
      }, 20000);
      return;
    }

    // Load PayPal SDK - enable credit card funding explicitly
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=ILS&locale=he_IL&enable-funding=card`;
    script.async = true;
    
    script.onload = () => {
      console.log('PayPal SDK loaded successfully');
      setScriptLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      console.error('Failed to load PayPal SDK');
      setError('שגיאה בטעינת מערכת התשלום. ייתכן שחוסם פרסומות מפריע.');
      setSimulationMode(true);
      setIsLoading(false);
    };
    
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    loadScript();
  }, [loadScript]);

  useEffect(() => {
    if (!scriptLoaded || !window.paypal || !paypalRef.current) {
      console.log('PayPal render check:', { scriptLoaded, hasPaypal: !!window.paypal, hasRef: !!paypalRef.current });
      return;
    }

    // Clear previous buttons before rendering new ones
    paypalRef.current.innerHTML = '';
    setButtonsRendered(false);

    console.log('Rendering PayPal buttons for amount:', amount);

    try {
      window.paypal.Buttons({
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: amount.toString(),
                currency_code: 'ILS'
              }
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          try {
            await actions.order.capture();
            callbacksRef.current.onSuccess();
          } catch (err) {
            console.error('Payment capture error:', err);
            callbacksRef.current.onError(err);
          }
        },
        onError: (err: any) => {
          console.error('PayPal button error:', err);
          callbacksRef.current.onError(err);
        },
        onCancel: () => {
          callbacksRef.current.onCancel?.();
        },
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'pill',
          label: 'pay',
          height: 40
        }
      }).render(paypalRef.current).then(() => {
        console.log('PayPal buttons rendered successfully');
        setButtonsRendered(true);
      }).catch((err: any) => {
        console.error('PayPal render error:', err);
        setError('שגיאה בטעינת כפתורי התשלום');
        setSimulationMode(true);
      });
    } catch (err) {
      console.error('PayPal initialization error:', err);
      setError('שגיאה בהפעלת מערכת התשלום');
      setSimulationMode(true);
    }

    return () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [scriptLoaded, amount]);

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setScriptLoaded(false);
    setSimulationMode(false);
    
    // Remove existing script
    const existingScript = document.querySelector(`script[src*="paypal.com/sdk/js"]`);
    if (existingScript) {
      existingScript.remove();
    }
    
    // Reload after a short delay
    setTimeout(() => {
      loadScript();
    }, 500);
  };

  const handleSimulatedPayment = () => {
    console.log('🔧 Simulating successful payment for testing');
    callbacksRef.current.onSuccess();
  };

  if (error) {
    return (
      <div className="w-full space-y-4 py-4">
        <div className="flex items-center justify-center gap-2 text-destructive text-center">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
        
        {/* Simulation Mode for Testing */}
        {simulationMode && (
          <div className="space-y-3">
            <Button 
              onClick={handleSimulatedPayment} 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
            >
              <TestTube className="w-4 h-4 ml-2" />
              סימולציית תשלום (לבדיקה)
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              כפתור זה מאפשר לבדוק את הזרימה כשמערכת התשלום לא זמינה
            </p>
          </div>
        )}
        
        <Button onClick={handleRetry} variant="outline" className="w-full">
          נסה שוב לטעון
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="mr-2 text-muted-foreground">טוען תשלום...</span>
        </div>
      )}
      
      {/* PayPal Buttons Container */}
      <div 
        ref={paypalRef} 
        className={isLoading ? 'hidden' : 'min-h-[80px]'}
      />
      
      {/* Note about credit card payments */}
      {!isLoading && buttonsRendered && (
        <div className="pt-3 text-center">
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span>ניתן לשלם גם בכרטיס אשראי ללא חשבון פייפאל</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default PayPalButton;
