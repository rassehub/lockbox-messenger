// src/models/User.ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  username!: string;

  @Column({ type: "text", unique: true })
  email!: string;

  @Column({ type: "text" })
  password_hash!: string;

  @Column({ type: "text" })
  public_key!: string;

  @Column({ type: "jsonb", nullable: true })
  prekey_bundle!: {
    identity_key: string;
    signed_prekey: string;
    one_time_prekeys: string[];
  } | null;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;
}