import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);
      const productStock = response.data;

      const cartProductIndex = cart.findIndex((product: Product) => product.id === productId);
      if (cartProductIndex === -1) {
        const response = await api.get(`/products/${productId}`);
        const productInfo = response.data;
        
        const updatedCart = [...cart, { ...productInfo, amount: 1 }];
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
        return;
      }

      if (cart[cartProductIndex].amount === productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const newProducts = cart.slice();
      newProducts[cartProductIndex].amount++;
      setCart(newProducts);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if (productIndex === -1) throw new Error();

      const newProducts = cart.slice();
      newProducts.splice(productIndex, 1);
      setCart(newProducts);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) throw new Error();;

      const response = await api.get(`/stock/${productId}`);
      const productStock = response.data;
      if (amount > productStock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const productIndex = cart.findIndex(product => product.id === productId);

      const newProducts = cart.slice();
      newProducts[productIndex].amount = amount;
      setCart(newProducts);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProducts));
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
