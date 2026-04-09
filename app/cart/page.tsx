import CartPageContent from "@/components/CartPageContent"
import { en } from "@/lib/dict"

export default function CartPage() {
  return <CartPageContent dict={en} shopHref="/shop" />
}
