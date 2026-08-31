import { tiaohouRefinedOf } from '../contracts/engines/masters-rules/tiaohou-refined'

const a = tiaohouRefinedOf(2, 8)
console.log('丙生申月:', JSON.stringify(a))
const b = tiaohouRefinedOf(0, 4)
console.log('甲生辰月:', JSON.stringify(b))
const c = tiaohouRefinedOf(8, 0)
console.log('壬生子月:', JSON.stringify(c))
const d = tiaohouRefinedOf(4, 4)
console.log('戊生辰月:', JSON.stringify(d))
