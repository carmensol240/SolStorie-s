declare global {
  interface Window {
    paypal?: {
      Buttons: (config: {
        createOrder: (data: any, actions: any) => Promise<string>;
        onApprove: (data: any, actions: any) => Promise<void>;
        onError?: (err: any) => void;
        onCancel?: () => void;
        style?: {
          layout?: 'vertical' | 'horizontal';
          color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
          shape?: 'rect' | 'pill';
          label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
          height?: number;
        };
      }) => {
        render: (element: HTMLElement) => Promise<void>;
      };
    };
  }
}

export {};
