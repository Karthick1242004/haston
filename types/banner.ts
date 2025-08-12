export interface BannerMessage {
  _id?: string
  id?: string
  text: string
  icon?: string
  isActive: boolean
  order: number
  createdAt?: Date
  updatedAt?: Date
}

export interface CreateBannerMessageRequest {
  text: string
  icon?: string
  isActive?: boolean
  order?: number
}

export interface UpdateBannerMessageRequest {
  text?: string
  icon?: string
  isActive?: boolean
  order?: number
}
