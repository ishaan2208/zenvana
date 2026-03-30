type MenuItemData = {
  name: string
  price: string
}

type MenuItemProps = {
  item: MenuItemData
  category: string
}

function isNonVegItem(name: string, category: string) {
  const lowerName = name.toLowerCase()
  const lowerCategory = category.toLowerCase()

  if (lowerCategory.includes('non veg')) return true
  if (lowerName.includes('chicken')) return true
  if (lowerName.includes('egg')) return true
  if (lowerName.includes('non veg')) return true

  return false
}

export function MenuItem({ item, category }: MenuItemProps) {
  const nonVeg = isNonVegItem(item.name, category)

  return (
    <article className="quiet-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[15px] font-semibold leading-6 text-foreground">{item.name}</h3>
        <div className="shrink-0 text-base font-bold text-primary">{item.price}</div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${nonVeg ? 'bg-[#C62828]' : 'bg-[#2E7D32]'}`}
          aria-hidden="true"
        />
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {nonVeg ? 'Non-Veg' : 'Veg'}
        </span>
      </div>
    </article>
  )
}

