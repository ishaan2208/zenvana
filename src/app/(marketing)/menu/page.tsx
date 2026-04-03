import type { Metadata } from 'next'

import { MenuSection } from '@/components/MenuSection'

export const metadata: Metadata = {
  title: 'Menu | Zenvana Hotels - Rajpur Road Dehradun',
  description:
    'Explore our full restaurant menu at Zenvana Hotels, Rajpur Road Dehradun. Freshly prepared dishes, beverages, and signature mains.',
}

const menuData = {
  'Tea & Coffee': [
    { name: 'Hot Coffee', price: '50/-' },
    { name: 'Honey Ginger Lemon', price: '40/-' },
    { name: 'Black Coffee', price: '30/-' },
    { name: 'Black Tea', price: '25/-' },
    { name: 'Cold Coffee', price: '120/-' },
  ],

  'Chinese Starter': [
    { name: 'Honey Chilly Potato', price: '210/-' },
    { name: 'Chilly Paneer (Gravy/Dry)', price: '260/-' },
    { name: 'Crispy Chilli Corn', price: '250/-' },
  ],

  'Appetizers & Salad': [
    { name: 'Papad Masala', price: '80/-' },
    { name: 'Peanut Masala', price: '120/-' },
    { name: 'Classic French Fries', price: '110/-' },
    { name: 'Aloo Chat', price: '120/-' },
    { name: 'Chana Chat', price: '120/-' },
    { name: 'Veg Pakoras (10 pcs)', price: '180/-' },
    { name: 'Paneer Pakoras (10 pcs)', price: '200/-' },
    { name: 'Green Salad', price: '100/-' },
    { name: 'Hakka Noodles', price: '150/200/-' },
    { name: 'Chilli Garlic Noodles', price: '150/200/-' },
  ],

  Breakfast: [
    { name: 'Bread Toast (4 Slices)', price: '100/-' },
    { name: 'Choice of Omelette (Masala/Cheese/Mushroom)', price: '120/-' },
    { name: 'Egg Bhurji', price: '200/-' },
    { name: 'Chole Bhature', price: '150/-' },
    { name: 'Puri Bhaji', price: '150/-' },
    { name: 'Maggi (Veg/Cheese)', price: '110/180/-' },
    { name: 'Macaroni (Veg/Non Veg)', price: '120/160/-' },
    { name: 'Sandwich (Egg/Cheese)', price: '120/160/-' },
    { name: 'Samosa (2 pcs)', price: '120/-' },
    { name: 'Kachori (pcs)', price: '120/-' },
    { name: 'Tikki (pcs)', price: '150/-' },
  ],

  'Pizza & Pasta': [
    { name: 'Margherita Pizza', price: '200/-' },
    { name: 'Palm House Pizza', price: '240/-' },
    { name: 'Paneer Grilled Sandwich', price: '250/-' },
    { name: 'Veg Grilled Sandwich', price: '180/-' },
    { name: 'Penne Arrabiata Pasta', price: '250/300/-' },
    { name: 'Penne Alfredo Pasta', price: '250/300/-' },
  ],

  'Veg Main Course': [
    { name: 'Mixed Veg', price: '200/-' },
    { name: 'Jeera Aloo', price: '200/-' },
    { name: 'Mushroom Mutter', price: '260/-' },
    { name: 'Butter Paneer Masala', price: '280/-' },
    { name: 'Kadai Paneer', price: '280/-' },
    { name: 'Dal Tadka', price: '200/-' },
    { name: 'Shahi Paneer', price: '280/-' },
    { name: 'Mushroom Masala', price: '280/-' },
    { name: 'Dal Makhani', price: '280/-' },
    { name: 'Soya Chaap Masala', price: '260/-' },
  ],

  'Non Veg Main Course': [
    { name: 'Butter Chicken', price: '300/500/-' },
    { name: 'Kadai Chicken', price: '300/500/-' },
    { name: 'Chicken Tikka Butter Masala', price: '300/500/-' },
    { name: 'Chicken Curry', price: '250/400/-' },
    { name: 'Chicken Kaali Mirch', price: '300/500/-' },
    { name: 'Chicken Rara', price: '300/500/-' },
    { name: 'Chicken Do Pyaza', price: '300/500/-' },
    { name: 'Chicken Changezi', price: '300/500/-' },
    { name: 'Egg Curry', price: '160/260/-' },
  ],

  Tandoori: [
    { name: 'Tandoori Chicken (Half/Full)', price: '300/500/-' },
    { name: 'Afghani Chicken (Half/Full)', price: '300/500/-' },
    { name: 'Chicken Tikka (Half/Full)', price: '300/500/-' },
    { name: 'Chicken Malai Tikka (Half/Full)', price: '300/500/-' },
    { name: 'Afghani Soya Chaap', price: '250/-' },
    { name: 'Masala Soya Chaap', price: '250/-' },
    { name: 'Paneer Tikka', price: '350/-' },
  ],

  Breads: [
    { name: 'Missi Roti', price: '35/-' },
    { name: 'Tandoori Roti / Butter', price: '20/25/-' },
    { name: 'Tawa Roti / Butter', price: '15/20/-' },
    { name: 'Stuffed Naan', price: '40/-' },
    { name: 'Plain / Butter Naan', price: '30/40/-' },
    { name: 'Garlic Naan', price: '50/-' },
  ],

  'Choice of Thali': [
    { name: 'Veg Thali (Dal Fry, Mix Veg, 3 Roti, Naan, Salad, Rice)', price: '299/-' },
    {
      name: 'Spl. Thali (Shahi Paneer, Dal Makhani, Jeera Rice, 3 Roti, 1 Naan, Salad, Raita, Gulab Jamun)',
      price: '299/-',
    },
    {
      name: 'Non Veg Thali (Butter Chicken, Dal Makhani, Jeera Rice, 4 Roti, 1 Naan, Salad, Gulab Jamun)',
      price: '399/-',
    },
  ],

  'Rice & Biryani': [
    { name: 'Veg Pulao', price: '180/-' },
    { name: 'Steamed Rice', price: '130/-' },
    { name: 'Jeera Rice', price: '180/-' },
    { name: 'Veg Fried Rice', price: '160/-' },
    { name: 'Egg Fried Rice', price: '180/-' },
    { name: 'Chicken Fried Rice', price: '220/-' },
    { name: 'Veg Biryani (With Curd)', price: '250/-' },
    { name: 'Chicken Biryani', price: 'Ask staff' },
    { name: 'Soya Chaap Biryani', price: 'Ask staff' },
    { name: 'Egg Biryani (With Curd)', price: 'Ask staff' },
  ],
} as const

export default function MenuPage() {
  return (
    <div className="bg-background text-foreground">
      <MenuSection menuData={menuData} />
    </div>
  )
}

