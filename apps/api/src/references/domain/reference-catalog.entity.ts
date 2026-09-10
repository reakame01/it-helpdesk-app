export type ReferenceCatalogProps = {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export class ReferenceCatalog {
  readonly id: string;
  readonly code: string;
  readonly nameTh: string;
  readonly nameEn: string;
  readonly itemCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: ReferenceCatalogProps) {
    this.id = props.id;
    this.code = props.code;
    this.nameTh = props.nameTh;
    this.nameEn = props.nameEn;
    this.itemCount = props.itemCount ?? 0;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
