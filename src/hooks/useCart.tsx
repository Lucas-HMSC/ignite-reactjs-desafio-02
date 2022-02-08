import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: productAdded } = await api.get(`products/${productId}`);
      const { data: productAddedStock } = await api.get<Stock>(`stock/${productId}`);

      const productAddedObj = {
        id: productAdded.id,
        title: productAdded.title,
        price: productAdded.price,
        image: productAdded.image,
        amount: 1
      }

      const verifyCart = cart.filter((item) => item.id === productId);
      if (verifyCart.length > 0) {
        updateProductAmount({
          productId: productAdded.id,
          amount: productAddedStock.amount
        });
        return;
      }

      const newCart = [...cart, productAddedObj];
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((item) => item.id !== productId);
      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart = cart.map((item) => 
        item.id === productId ? {
          ...item, 
          amount: item.amount + 1 
        } : item);

      const verifyAmount = newCart.filter((item) => item.amount > amount);
      if (verifyAmount.length > 0) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
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
