import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const asyncStorageProducts = await AsyncStorage.getItem(
        '@goMarketPlace:produtcs',
      );

      if (asyncStorageProducts) {
        setProducts(JSON.parse(asyncStorageProducts));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(async product => {
    const loadNewProduct = (
      prevProducts: Product[],
      newProduct: Product,
    ): Product[] => {
      const productExists = prevProducts.find(
        prevProduct => prevProduct.id === newProduct.id,
      );

      if (productExists) {
        const nextProductState = prevProducts.map(prevProduct => {
          if (prevProduct.id === newProduct.id) {
            return { ...prevProduct, quantity: prevProduct.quantity + 1 };
          }

          return prevProduct;
        });

        return [...nextProductState];
      }

      return [...prevProducts, { ...product, quantity: 1 }];
    };

    setProducts(prevProductState => loadNewProduct(prevProductState, product));

    const asyncStorageProduct = JSON.parse(
      (await AsyncStorage.getItem('@goMarketPlace:produtcs')) || '[]',
    ) as Product[];

    if (asyncStorageProduct) {
      await AsyncStorage.setItem(
        '@goMarketPlace:produtcs',
        JSON.stringify(loadNewProduct(asyncStorageProduct, product)),
      );
    } else {
      await AsyncStorage.setItem(
        '@goMarketPlace:produtcs',
        JSON.stringify([product]),
      );
    }
  }, []);

  const increment = useCallback(async id => {
    setProducts(prevProductState => {
      const newProductState = prevProductState.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }

        return product;
      });

      return newProductState;
    });

    const asyncStorageProduct = JSON.parse(
      (await AsyncStorage.getItem('@goMarketPlace:produtcs')) || '[]',
    ) as Product[];

    if (asyncStorageProduct) {
      const updatedProducts = asyncStorageProduct.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity + 1 };
        }

        return product;
      });

      await AsyncStorage.setItem(
        '@goMarketPlace:produtcs',
        JSON.stringify(updatedProducts),
      );
    }
  }, []);

  const decrement = useCallback(async id => {
    setProducts(prevProductState => {
      const newProductState = prevProductState.map(product => {
        if (product.id === id && product.quantity > 0) {
          return { ...product, quantity: product.quantity - 1 };
        }

        return product;
      });

      return newProductState;
    });

    const asyncStorageProduct = JSON.parse(
      (await AsyncStorage.getItem('@goMarketPlace:produtcs')) || '[]',
    ) as Product[];

    if (asyncStorageProduct) {
      const updatedProducts = asyncStorageProduct.map(product => {
        if (product.id === id) {
          return { ...product, quantity: product.quantity - 1 };
        }

        return product;
      });

      await AsyncStorage.setItem(
        '@goMarketPlace:produtcs',
        JSON.stringify(updatedProducts),
      );
    }
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
