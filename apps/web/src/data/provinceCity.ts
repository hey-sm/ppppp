import type { MRegionTreeData } from '@fluxp/ui/types'

type ProvinceRaw = {
  code?: string
  name?: string
  value?: string
  label?: string
  province?: string
}

type CityRaw = {
  code?: string
  name?: string
  value?: string
  label?: string
  province?: string
  provinceCode?: string
}

type Province = { code: string; name: string; provinceId?: string }
type City = { code: string; name: string; provinceKey: string }

let provinceCityPromise: Promise<MRegionTreeData> | null = null

export function loadProvinceCityData(): Promise<MRegionTreeData> {
  if (provinceCityPromise) return provinceCityPromise

  provinceCityPromise = Promise.all([
    import('province-city-china/dist/province.json'),
    import('province-city-china/dist/city.json'),
  ])
    .then(([provinceModule, cityModule]) => {
      const provinceJson = provinceModule.default as ProvinceRaw[]
      const cityJson = cityModule.default as CityRaw[]

    const provinces = provinceJson
      .map((p) => {
        const code = p.code ?? p.value
        const name = p.name ?? p.label
        if (!code || !name) return null
        return { code, name, provinceId: p.province }
      })
      .filter(Boolean) as Province[]

    const cities = cityJson
      .map((c) => {
        const code = c.code ?? c.value
        const name = c.name ?? c.label
        const provinceKey = c.provinceCode ?? c.province
        if (!code || !name || !provinceKey) return null
        return { code, name, provinceKey }
      })
      .filter(Boolean) as City[]

    const provinceById = new Map<string, Province>()
    const provinceByCode = new Map<string, Province>()
    for (const p of provinces) {
      provinceByCode.set(p.code, p)
      if (p.provinceId) provinceById.set(p.provinceId, p)
    }

    const cityByProvinceCode = new Map<string, Array<{ code: string; name: string }>>()
    for (const c of cities) {
      const p = provinceByCode.get(c.provinceKey) ?? provinceById.get(c.provinceKey)
      if (!p) continue
      const list = cityByProvinceCode.get(p.code) ?? []
      list.push({ code: c.code, name: c.name })
      cityByProvinceCode.set(p.code, list)
    }

      return provinces
        .slice()
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((p) => ({
          code: p.code,
          name: p.name,
          children: (cityByProvinceCode.get(p.code) ?? []).sort((a, b) =>
            a.code.localeCompare(b.code),
          ),
        }))
    })
    .catch((error) => {
      provinceCityPromise = null
      throw error
    })

  return provinceCityPromise
}

export function prefetchProvinceCityData() {
  void loadProvinceCityData()
}
