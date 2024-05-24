import { Prisma } from '@prisma/client';

const ThaiDate = () => {
  // return '2024/02/28';
  const timest = Date.now() + 7 * 60 * 60 * 1000;
  const yyyy = new Date(timest).getUTCFullYear();
  const mm = new Date(timest).getUTCMonth() + 1;
  const dd = new Date(timest).getUTCDate();
  return `${yyyy}-${mm.toString().padStart(2, '0')}-${dd
    .toString()
    .padStart(2, '0')}`;
};

export const users: Prisma.UserCreateManyArgs = {
  data: [
    {
      username: 'rootAdmin',
      password: 'FNaJe1wg3Bszv/o5NrqhYuIcPczkSl07v7LxY+v8cQE=', //password = 123456
      salt: '2f569eeaba86cb3be5db9edce86e0c6e',
      role: 'SUPER_ADMIN',
    },
    {
      username: 'admin',
      password: 'z91huOJRERKGBVdMg65V5p211nl2wkfPtOGPoAyD5uQ=',
      role: 'ADMIN',
      branchMasterId: 1,
      salt: '1512e27b8f8a0413d171818a2d4ff501',
    },
    {
      username: 'staff1',
      password: '8fuLby1Gb77D4hoHiwoa5KhPTY3CwTDuwp4bSgUIsYE=',
      role: 'STAFF',
      branchMasterId: 1,
      branchId: 1,
      salt: '74788b6b4e3f2675fc3467ff13f9a0e6',
    },
    {
      username: 'staff2',
      password: 'Wzmhq0ZGpjGAJvppmkgKc+pVAxl89y3xO5mhsxi4KOA=',
      role: 'STAFF',
      branchMasterId: 1,
      branchId: 2,
      salt: 'd96de71d38492c75cb190661c3fff4aa',
    },
    {
      username: 'packer1',
      password: '0wWrUXhJ8pQ4i2HUapOS9PlHL4FwpVkJOmdIOF7xkK8=',
      role: 'PACKING',
      branchMasterId: 1,
      salt: '8134cda4c4cbad49a7b323f50615f9da',
    },
    {
      username: 'deliver1',
      password: 'gw/ezkvq2RbV2LYZd0ccnjGQDzThB4SpGt2Fxu54Ksk=',
      role: 'DELIVER',
      branchMasterId: 1,
      salt: '75232fc3a9a598f6216759698ded97ce',
    },
    {
      username: 'deliver2',
      password: 'rnYnad3cFzvBg5v/TJBOtGNmuBi67mu6EZbS3EgIfD8=',
      role: 'DELIVER',
      branchMasterId: 1,
      salt: 'b6d92e147779d39523e5f85d6aaa177f',
    },
  ],
  skipDuplicates: true,
};

export const branchMaster: Prisma.BranchMasterCreateManyArgs = {
  data: [
    {
      name: "Dou's Kitchen Center 1",
    },
  ],
  skipDuplicates: true,
};

export const branch: Prisma.BranchCreateManyArgs = {
  data: [
    {
      name: 'branch1',
      branchMasterId: 1,
    },
    {
      name: 'branch2',
      branchMasterId: 1,
    },
    {
      name: 'branch3',
      branchMasterId: 1,
    },
  ],
  skipDuplicates: true,
};

export const product: Prisma.ProductCreateManyArgs = {
  data: [
    { name: 'น้ำเต้าหู้', price: 10, productTypeId: 1 },
    { name: 'น้ำขิง', price: 20, productTypeId: 1 },
    { name: 'นมสด', price: 30, productTypeId: 1 },
    { name: 'ซุปงาดำ', price: 25, productTypeId: 1 },
    { name: 'น้ำลำไย', price: 35, productTypeId: 1 },
    { name: 'น้ำเชื่อมใบเตย', price: 35, productTypeId: 1 },
    { name: 'น้ำเต้าหู้เย็น (ไม่ผสม)', price: 35, productTypeId: 1 },
    { name: 'น้ำขิงน้ำผึ้ง เย็น', price: 35, productTypeId: 1 },
    { name: 'ข้าวบาร์เลย์', price: 35, productTypeId: 2 },
    { name: 'ลูกเดือย', price: 35, productTypeId: 2 },
    { name: 'ถั่วแดง', price: 35, productTypeId: 2 },
    { name: 'ถั่วดำ', price: 35, productTypeId: 2 },
    { name: 'ถั่วขาว', price: 35, productTypeId: 2 },
    { name: 'ถั่วเขียว', price: 35, productTypeId: 2 },
    { name: 'ถั่วเหลือง', price: 35, productTypeId: 2 },
    { name: 'แปะก๊วย', price: 35, productTypeId: 3 },
    { name: 'เม็ดบัว', price: 35, productTypeId: 3 },
    { name: 'พุทรา', price: 35, productTypeId: 3 },
    { name: 'รากบัว', price: 35, productTypeId: 3 },
    { name: 'มะตูม', price: 35, productTypeId: 3 },
    { name: 'ฟักเชื่อม', price: 35, productTypeId: 3 },
    { name: 'วุ้น', price: 45, productTypeId: 4 },
    { name: 'สาคู', price: 45, productTypeId: 4 },
    { name: 'สังขยา', price: 45, productTypeId: 4 },
    { name: 'เฉาก๊วย', price: 45, productTypeId: 4 },
    { name: 'เต้าฮวย', price: 45, productTypeId: 4 },
    { name: 'ปาท่องโก๋ เกลียว (500 กรัม/ถุง)', price: 55, productTypeId: 5 },
    { name: 'ปาท่องโก๋ แท่ง (500 กรัม/ถุง)', price: 55, productTypeId: 5 },
    { name: 'ขนมปัง (10 ชิ้น/ถุง)', price: 55, productTypeId: 5 },
    { name: 'บัวลอยไส้งาดำ', price: 55, productTypeId: 5 },
    { name: 'ฟองเต้าหู้ (500 กรัม/ถุง)', price: 55, productTypeId: 5 },
    { name: 'แมงลัก', price: 65, productTypeId: 6 },
    { name: 'ปาท่องโก๋กรอบ', price: 65, productTypeId: 6 },
    { name: 'งาดำป่น (500 กรัม/ถุง)', price: 65, productTypeId: 6 },
    { name: 'น้ำอ้อยธรรมชาติ (มิตรผล)', price: 75, productTypeId: 7 },
    { name: 'น้ำตาลทรายแดง (ข้าวทอง)', price: 75, productTypeId: 7 },
  ],
  skipDuplicates: true,
};

export const productType: Prisma.ProductTypeCreateManyArgs = {
  data: [
    { name: 'น้ำ' },
    { name: 'ถั่ว' },
    { name: 'เครื่องเชื่อม' },
    { name: 'เครื่องเปียก' },
    { name: 'ปาท่องโก๋ /ขนมปัง /ฟองเต้าหู้/ บัวลอย' },
    { name: 'อื่นๆ' },
    { name: 'น้ำตาล' },
  ],
  skipDuplicates: true,
};

export const stocks: Prisma.StockCreateManyArgs = {
  data: (product.data as any[]).map((p, i) => {
    return {
      date: ThaiDate(),
      branchMasterId: 1,
      productId: i + 1,
      productName: p.name,
      productTypeId: p.productTypeId,
      totalIn: 0,
      readyToPack: 0,
      totalOut: 0,
      stockBalance: 0,
    };
  }),
  skipDuplicates: true,
};

const branchStockData: Prisma.BranchStockCreateManyInput[] = [];
for (let branchId = 1; branchId <= 3; branchId++) {
  (product.data as any[]).forEach((p, i) => {
    branchStockData.push({
      branchMasterId: 1,
      branchId,
      productId: i + 1,
      productName: p.name,
      productTypeId: p.productTypeId,
      amount: 0,
    });
  });
}

export const branchStock: Prisma.BranchStockCreateManyArgs = {
  data: branchStockData,
  skipDuplicates: true,
};

const limitProductData = () => {
  const res = [];

  for (const i in product.data as any[]) {
    const p = (product.data as any[])[i];
    for (let branchId = 1; branchId <= 3; branchId++) {
      res.push({
        branchId: branchId,
        branchMasterId: 1,
        productId: Number(i) + 1,
        productName: p.name,
        productTypeId: p.productTypeId,
        limit: null,
      });
    }
  }
  return res;
};

const mapBranchProductData = () => {
  const res = [];

  for (const i in product.data as any[]) {
    const p = (product.data as any[])[i];
    for (let branchId = 1; branchId <= 3; branchId++) {
      res.push({
        amount: 0,
        allTimeAmount: 0,
        branchId: branchId,
        branchMasterId: 1,
        productId: Number(i) + 1,
        productName: p.name,
        date: '2023-01-01',
      });
    }
  }
  return res;
};

const defaultLimitProductData = () => {
  const res = [];

  for (const i in product.data as any[]) {
    const p = (product.data as any[])[i];
    res.push({
      branchId: null,
      branchMasterId: 1,
      productId: Number(i) + 1,
      productName: p.name,
      productTypeId: p.productTypeId,
      limit: null,
    });
  }
  return res;
};

export const limitProduct: Prisma.LimitProductCreateManyArgs = {
  data: limitProductData(),
  skipDuplicates: true,
};

export const defaultLimitProduct: Prisma.LimitProductCreateManyArgs = {
  data: defaultLimitProductData(),
  skipDuplicates: true,
};

export const mapBranchProduct: Prisma.MapBranchProductCreateManyArgs = {
  data: mapBranchProductData(),
  skipDuplicates: true,
};
