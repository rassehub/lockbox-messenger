// src/models/User.ts
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

/**
 * Signal Protocol Key Bundle Structure
 * Stores the public keys needed for other users to establish encrypted sessions
 */
interface SignalKeyBundle {
  registrationId: number;
  identityPubKey: string; // Base64 encoded ArrayBuffer
  signedPreKey: {
    keyId: number;
    publicKey: string; // Base64 encoded
    signature: string; // Base64 encoded
  };
  oneTimePreKeys: Array<{
    keyId: number;
    publicKey: string; // Base64 encoded
  }>;
}

/**
 * One-Time Pre-Key storage for atomic operations
 * Separate table ensures uniqueness and prevents race conditions
 */
@Entity("prekeys")
@Index(["userId", "keyId"], { unique: true }) // Composite unique constraint
export class PreKey {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  @Index()
  userId!: string;

  @Column({ type: "integer" })
  keyId!: number;

  @Column({ type: "text" })
  publicKey!: string; // Base64 encoded

  @Column({ type: "boolean", default: false })
  @Index()
  consumed!: boolean;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  consumedAt!: Date | null;
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", unique: true })
  username!: string;

  @Column({ type: "text", unique: true })
  phone_number!: string;

  @Column({ type: "text" })
  password_hash!: string;

  // Signal Protocol Keys (without oneTimePreKeys - those are in separate table)
  @Column({ type: "jsonb", nullable: true })
  signal_key_bundle!: Omit<SignalKeyBundle, 'oneTimePreKeys'> & {
    // Store signed pre-key separately since it rotates less frequently
    signedPreKey: {
      keyId: number;
      publicKey: string;
      signature: string;
    };
  } | null;

  // Metadata
  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @Column({ type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  keys_updated_at!: Date;
}

export type { SignalKeyBundle };