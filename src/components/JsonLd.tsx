type Props = {
  data: object | object[]
}

export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data) ? data : [data]
  return (
    <>
      {payload.map((entry, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  )
}
