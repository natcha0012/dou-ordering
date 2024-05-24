import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/index';
import {
  users,
  branchMaster,
  branch,
  product,
  stocks,
  productType,
  limitProduct,
  defaultLimitProduct,
  mapBranchProduct,
  branchStock,
} from './data';
@Injectable()
export class SeedService {
  constructor(private readonly prisma: PrismaService) {}
  async seed() {
    await this.prisma.branchMaster.createMany(branchMaster);
    await this.prisma.branch.createMany(branch);
    await this.prisma.user.createMany(users);
    await this.prisma.productType.createMany(productType);
    await this.prisma.product.createMany(product);
    await this.prisma.limitProduct.createMany(limitProduct);
    await this.prisma.mapBranchProduct.createMany(mapBranchProduct);
    await this.prisma.branchStock.createMany(branchStock);
    const defaultProduct = await this.prisma.limitProduct.findFirst({
      where: { branchId: null },
    });

    if (!defaultProduct) {
      await this.prisma.limitProduct.createMany(defaultLimitProduct);
    }
    await this.prisma.stock.createMany(stocks);
    await this.updateStockPackOrder();
    await this.updateStockPlaceOrder();
    await this.updateStockAdjustOrder();
    await this.addBranchProduct();
  }

  async updateStockPackOrder() {
    await this.prisma.$queryRaw`
    CREATE OR REPLACE PROCEDURE public.update_stock_pack_order(IN create_details character varying, IN update_details character varying)
     LANGUAGE plpgsql
    AS $procedure$      
          DECLARE
              detail VARCHAR;
              item VARCHAR[];
    		  detail2 VARCHAR;
    		  item2 VARCHAR[];
          BEGIN
              FOREACH detail in ARRAY STRING_TO_ARRAY(create_details, '##')
              LOOP
                item = STRING_TO_ARRAY(detail, '|');
                /*
                  |   name        	| index |
                  | date          	|   1   |
                  | totalIn       	|   2   |
                  | totalOut       	|   3   |
                  | readyToPack   	|	  4 	|
                  | stockBalance  	|	  5	  |
                  | productId		    |	  6	  |
                  | productName		  |	  7	  |
                  | branchMasterId	|	  8	  |
                  | spoiledAmount	  |	  9	  |
                */
                INSERT INTO stock ("date", today_in, today_out, ready_to_pack, stock_balance, product_id, product_name,branch_master_id, spoil_amount)
                  VALUES(item[1],item[2]::INT4,item[3]::INT4,item[4]::INT4,item[5]::INT4,item[6]::INT4,item[7],item[8]::INT4,item[9]::INT4);
              END LOOP;

    		  FOREACH detail2 in ARRAY STRING_TO_ARRAY(update_details, '##')
              LOOP
                item2 = STRING_TO_ARRAY(detail2, '|');
                /*
                  |   name        	| index |
                  | stockID         |   1   |
                  | totalOut       	|   2   |
                  | readyToPack   	|	  3	  |
                  | stockBalance  	|	  4 	|
                */
              	UPDATE stock
              	SET today_out=item2[2]::INT4, ready_to_pack= item2[3]::INT4, stock_balance= item2[4]::INT4
              	WHERE id = item2[1]::INT8;
              END LOOP;
          END;
    $procedure$
    `;
  }

  async updateStockPlaceOrder() {
    await this.prisma.$queryRaw`
      CREATE OR REPLACE PROCEDURE public.update_stock_place_order(IN update_stock character varying, IN order_id bigint)
       LANGUAGE plpgsql
      AS $procedure$      
                DECLARE
                    detail VARCHAR;
                    item VARCHAR[];
                BEGIN
                    FOREACH detail in ARRAY STRING_TO_ARRAY(update_stock, '##')
                    LOOP
                      item = STRING_TO_ARRAY(detail, '|');
                      /*
                        |   name        	| index |
                        | amount          |   1   |
                        | stockId       	|   2   |
                      */
                      UPDATE stock
                      SET ready_to_pack = ready_to_pack + item[1]::INT4
                      WHERE id = item[2]::INT8;
                    END LOOP;

      			  UPDATE "order"
      			  SET status = 'ORDER_PLACED', queue_status = 'IN_PROGRESS'
      			  WHERE id = order_id;
                END;
          $procedure$
    `;
  }

  async updateStockAdjustOrder() {
    await this.prisma.$queryRaw`
      CREATE OR REPLACE PROCEDURE public.update_stock_adjust_order(IN reserve_stock character varying, IN retrieve_stock character varying)
       LANGUAGE plpgsql
      AS $procedure$      
                DECLARE
                    detail VARCHAR;
                    item VARCHAR[];
      			  detail2 VARCHAR;
                    item2 VARCHAR[];
                BEGIN
                    FOREACH detail in ARRAY STRING_TO_ARRAY(reserve_stock, '##')
                    LOOP
                      item = STRING_TO_ARRAY(detail, '|');
                      /*
                        |   name        	| index |
                        | amount          |   1   |
                        | stockId       	|   2   |
                      */
                      UPDATE stock
                      SET ready_to_pack = ready_to_pack + item[1]::INT4
                      WHERE id = item[2]::INT8;
                    END LOOP;

      			  FOREACH detail2 in ARRAY STRING_TO_ARRAY(retrieve_stock, '##')
                    LOOP
                      item2 = STRING_TO_ARRAY(detail2, '|');
                      /*
                        |   name        	| index |
                        | amount          |   1   |
                        | stockId       	|   2   |
                      */
                      UPDATE stock
                      SET ready_to_pack = ready_to_pack - item2[1]::INT4
                      WHERE id = item2[2]::INT8;
                    END LOOP;
                END;
          $procedure$
    `;
  }

  async addBranchProduct() {
    await this.prisma.$queryRaw`
    CREATE OR REPLACE PROCEDURE public.add_branch_product(IN create_details character varying, IN update_details character varying)
     LANGUAGE plpgsql
    AS $procedure$      
          DECLARE
              detail VARCHAR;
              item VARCHAR[];
    		      detail2 VARCHAR;
    		      item2 VARCHAR[];
          BEGIN
              FOREACH detail in ARRAY STRING_TO_ARRAY(create_details, '##')
              LOOP
                item = STRING_TO_ARRAY(detail, '|');
                /*
                  |   name        	| index |
                  | date          	|   1   |
                  | amount          |   2   |
                  | productId       |   3   |
                  | productName   	|	  4 	|
                  | branchMasterID 	|	  5	  |
                  | branchId		    |	  6	  |
                  | allTimeAmount		|	  7	  |
                */
                INSERT INTO map_branch_product ("date", amount, product_id, product_name, branch_master_id, branch_id, all_time_amount)
                  VALUES(item[1],item[2]::INT4,item[3]::INT4,item[4],item[5]::INT4,item[6]::INT4,item[7]::INT8);
              END LOOP;

    		  FOREACH detail2 in ARRAY STRING_TO_ARRAY(update_details, '##')
              LOOP
                item2 = STRING_TO_ARRAY(detail2, '|');
                /*
                  |   name        	| index |
                  | id              |   1   |
                  | amount         	|   2   |
                */
              	UPDATE map_branch_product
              	SET amount=amount+item2[2]::INT4, all_time_amount= all_time_amount + item2[2]::INT4
              	WHERE id = item2[1]::INT8;
              END LOOP;
          END;
    $procedure$
    `;
  }

  async setLimitProduct() {
    await this.prisma.$queryRaw`
    CREATE OR REPLACE PROCEDURE public.set_limit_product(IN details character varying, IN master_id integer, IN b_id integer)
    LANGUAGE plpgsql
    AS $procedure$      
          DECLARE
              detail VARCHAR;
              item VARCHAR[];
          BEGIN
              FOREACH detail in ARRAY STRING_TO_ARRAY(details, '##')
              LOOP
                item = STRING_TO_ARRAY(detail, '|');
                /*
                  |   name        	| index |
                  | productId      	|   1   |
                  | limit		       	|   2   |
                */
                if b_id is NULL THEN
                  UPDATE limit_product
                  SET "limit"=item[2]::INT4
                  WHERE branch_master_id=master_id and product_id = item[1]::INT8;
                else
                  UPDATE limit_product
                  SET "limit"=item[2]::INT4
                  WHERE branch_master_id=master_id and product_id = item[1]::INT8 and branch_id = b_id;
      end if;
              END LOOP;

          END;
    $procedure$

    `;
  }
}
