export interface LookItem {
  name: string
  price: number
}

export interface Look {
  id: number
  title: string
  image: string
  items: LookItem[]
  totalPrice: number
  bundlePrice: number
}

export interface CenterLook {
  id: number
  title: string
  image: string
  leftItems: LookItem[]
  rightItems: LookItem[]
  leftTotal: number
  leftBundlePrice: number
  rightTotal: number
  rightBundlePrice: number
}
