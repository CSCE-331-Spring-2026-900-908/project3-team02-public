export interface MenuItem {
  itemid: number
  itemname: string
  price: number
  category: string
  description: string
  image?: string | null
}

export interface OrderItem {
  itemId: number
  itemName: string
  price: number
  qty: number
  customizations?: string
  cartId: string
}
