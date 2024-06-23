import { Prisma } from '@prisma/client';

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
    { name: 'น้ำเต้าหู้', productTypeId: 1 },
    { name: 'น้ำขิง', productTypeId: 1 },
    { name: 'นมสด', productTypeId: 1 },
    { name: 'ซุปงาดำ', productTypeId: 1 },
    { name: 'น้ำลำไย', productTypeId: 1 },
    { name: 'น้ำเชื่อมใบเตย', productTypeId: 1 },
    { name: 'น้ำเต้าหู้เย็น (ไม่ผสม)', productTypeId: 1 },
    { name: 'น้ำขิงน้ำผึ้ง เย็น', productTypeId: 1 },
    { name: 'ข้าวบาร์เลย์', productTypeId: 2 },
    { name: 'ลูกเดือย', productTypeId: 2 },
    { name: 'ถั่วแดง', productTypeId: 2 },
    { name: 'ถั่วดำ', productTypeId: 2 },
    { name: 'ถั่วขาว', productTypeId: 2 },
    { name: 'ถั่วเขียว', productTypeId: 2 },
    { name: 'ถั่วเหลือง', productTypeId: 2 },
    { name: 'แปะก๊วย', productTypeId: 3 },
    { name: 'เม็ดบัว', productTypeId: 3 },
    { name: 'พุทรา', productTypeId: 3 },
    { name: 'รากบัว', productTypeId: 3 },
    { name: 'มะตูม', productTypeId: 3 },
    { name: 'ฟักเชื่อม', productTypeId: 3 },
    { name: 'วุ้น', productTypeId: 4 },
    { name: 'สาคู', productTypeId: 4 },
    { name: 'สังขยา', productTypeId: 4 },
    { name: 'เฉาก๊วย', productTypeId: 4 },
    { name: 'เต้าฮวย', productTypeId: 4 },
    { name: 'ปาท่องโก๋ เกลียว (500 กรัม/ถุง)', productTypeId: 5 },
    { name: 'ปาท่องโก๋ แท่ง (500 กรัม/ถุง)', productTypeId: 5 },
    { name: 'ขนมปัง (10 ชิ้น/ถุง)', productTypeId: 5 },
    { name: 'บัวลอยไส้งาดำ', productTypeId: 5 },
    { name: 'ฟองเต้าหู้ (500 กรัม/ถุง)', productTypeId: 5 },
    { name: 'แมงลัก', productTypeId: 6 },
    { name: 'ปาท่องโก๋กรอบ', productTypeId: 6 },
    { name: 'งาดำป่น (500 กรัม/ถุง)', productTypeId: 6 },
    { name: 'น้ำอ้อยธรรมชาติ (มิตรผล)', productTypeId: 7 },
    { name: 'น้ำตาลทรายแดง (ข้าวทอง)', productTypeId: 7 },
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
