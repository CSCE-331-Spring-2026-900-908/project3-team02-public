export type DrinkTag =
  | 'creamy'
  | 'fruity'
  | 'refreshing'
  | 'caffeine-free'
  | 'first-timer'
  | 'dessert-like'
  | 'snack'

export const DRINK_TAGS: Record<number, DrinkTag[]> = {
  1: ['creamy', 'first-timer'],                          // Classic Milk Tea
  2: ['creamy', 'first-timer', 'dessert-like'],          // Taro Milk Tea
  3: ['creamy'],                                         // Matcha Milk Tea
  4: ['creamy', 'dessert-like'],                         // Tiger Sugar Milk Tea
  5: ['creamy', 'first-timer', 'dessert-like'],          // Brown Sugar Milk Tea
  6: ['fruity', 'refreshing', 'first-timer'],            // Mango Green Tea
  7: ['fruity', 'refreshing'],                           // Passion Fruit Tea
  8: ['fruity', 'refreshing'],                           // Lychee Oolong Tea
  9: ['fruity', 'refreshing'],                           // Strawberry Black Tea
  10: ['fruity', 'refreshing'],                          // Peach Green Tea
  11: ['creamy', 'caffeine-free', 'dessert-like'],       // Ube Latte
  12: ['creamy', 'dessert-like'],                        // Thai Tea
  13: ['creamy', 'dessert-like'],                        // Hokkaido Milk Tea
  14: ['creamy', 'dessert-like', 'caffeine-free', 'first-timer'], // Oreo Cream Smoothie
  15: ['creamy'],                                        // Coconut Milk Tea
  16: ['fruity', 'refreshing', 'caffeine-free', 'first-timer'],   // Watermelon Slush
  17: ['fruity', 'refreshing', 'caffeine-free'],         // Lemon Wintermelon Refresh
  18: ['snack', 'dessert-like'],                         // Egg Puff Waffle
  19: ['snack', 'dessert-like'],                         // Mochi Donut (3pc)
  20: ['snack'],                                         // Spring Roll (2pc)
  21: ['creamy', 'dessert-like'],                        // psl
}

export const BESTSELLER_IDS: number[] = [
  2,  // Taro Milk Tea
  5,  // Brown Sugar Milk Tea
  6,  // Mango Green Tea
]

export function getTags(itemid: number): DrinkTag[] {
  return DRINK_TAGS[itemid] ?? []
}

export function isBestseller(itemid: number): boolean {
  return BESTSELLER_IDS.includes(itemid)
}
