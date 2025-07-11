import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Auth } from '@/components/Auth';
import { Header } from '@/components/Header';
import { ProductGrid } from '@/components/ProductGrid';
import { Cart } from '@/components/Cart';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Leaf, Truck, Shield, Heart } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onCartOpen={() => setCartOpen(true)} />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
              <Badge variant="secondary" className="mb-4">
                <Leaf className="h-3 w-3 mr-1" />
                Premium Shopping
              </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Discover Your Shopping Universe
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              From the latest electronics to trending fashion, find everything you need in one place.
              Quality products, competitive prices, delivered to your door.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="flex flex-col items-center p-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-2">
                  <Leaf className="h-6 w-6 text-success" />
                </div>
                <span className="text-sm font-medium">Quality Products</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Fast Shipping</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-secondary-foreground" />
                </div>
                <span className="text-sm font-medium">Secure</span>
              </div>
              <div className="flex flex-col items-center p-4">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                  <Heart className="h-6 w-6 text-destructive" />
                </div>
                <span className="text-sm font-medium">Loved by Many</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Products Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Carefully curated products that combine quality, style, and value. 
              Each item is chosen for its exceptional quality and customer satisfaction.
            </p>
          </div>
          
          <ProductGrid />
        </div>
      </section>

      <Cart open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
};

export default Index;
