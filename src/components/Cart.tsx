import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { Minus, Plus, Trash2, Package, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CartProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Cart({ open, onOpenChange }: CartProps) {
  const { cartItems, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { toast } = useToast();

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    toast({
      title: "Checkout Started",
      description: "Redirecting to payment...",
    });

    // In a real app, you would integrate with a payment processor
    // For now, we'll just clear the cart after a delay
    setTimeout(async () => {
      await clearCart();
      onOpenChange(false);
      toast({
        title: "Order Placed!",
        description: "Thank you for your purchase. You'll receive a confirmation email shortly.",
      });
    }, 2000);
  };

  const totalPrice = getTotalPrice();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Shopping Cart
          </SheetTitle>
          <SheetDescription>
            {cartItems.length === 0 
              ? "Your cart is empty" 
              : `${cartItems.length} item${cartItems.length > 1 ? 's' : ''} in your cart`
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-6">
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                        {item.product.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm leading-tight">
                            {item.product.name}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Badge variant="secondary" className="min-w-[2rem] text-center">
                              {item.quantity}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                              disabled={item.quantity >= item.product.stock_quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <span className="font-semibold text-primary">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${totalPrice.toFixed(2)}</span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      size="lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout - ${totalPrice.toFixed(2)}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      className="w-full"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}