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

export interface ChatCustomization {
  customizationid: number
  name: string
  category: string
  price: number
  ingredients?: string
  isactive: boolean
}

export type ChatBobaOption = '' | 'Regular Boba' | 'Extra Boba' | 'No Boba'

export interface ChatSelections {
  size?: string
  temperature?: string
  ice?: string
  sweetness?: string
  milk?: string
  toppings?: string[]
  boba?: ChatBobaOption
}
