import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Package, Star } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  stock_quantity: number;
  category: {
    name: string;
  };
}

export function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden animate-pulse">
            <div className="aspect-square bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded mb-4" />
              <div className="h-6 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Featured Products Carousel */}
      <div className="relative">
        <h3 className="text-xl font-semibold mb-4">Featured Products</h3>
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {products.slice(0, 6).map((product) => (
              <CarouselItem key={product.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
                  <div className="aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-16 w-16 text-muted-foreground" />
                    )}
                    <Badge 
                      variant={product.stock_quantity > 10 ? "secondary" : product.stock_quantity > 0 ? "destructive" : "outline"}
                      className="absolute top-2 right-2"
                    >
                      {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {product.category?.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="h-4 w-4 fill-warning text-warning"
                        />
                      ))}
                      <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0">
                    <Button
                      onClick={() => addToCart(product.id)}
                      disabled={product.stock_quantity === 0}
                      className="w-full"
                      variant={product.stock_quantity === 0 ? "secondary" : "default"}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                  </CardFooter>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* All Products Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">All Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow border-2 hover:border-primary/20">
              <div className="aspect-square bg-gradient-to-br from-secondary to-muted flex items-center justify-center relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-muted-foreground" />
                )}
                <Badge 
                  variant={product.stock_quantity > 10 ? "secondary" : product.stock_quantity > 0 ? "destructive" : "outline"}
                  className="absolute top-2 right-2"
                >
                  {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
                </Badge>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {product.category?.name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-warning text-warning"
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">(4.8)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0">
                <Button
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock_quantity === 0}
                  className="w-full"
                  variant={product.stock_quantity === 0 ? "secondary" : "default"}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}