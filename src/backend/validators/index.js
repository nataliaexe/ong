import { z } from "zod"

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(1000)
})

export const donationSchema = z.object({
  amount: z.number().min(1).max(10000),
  email: z.string().email().optional()
})

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200)
})

export const animalSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(["dog", "cat"]),
  ageLabel: z.string().min(1).max(50),
  size: z.enum(["pequeno", "medio", "grande"]),
  gender: z.enum(["macho", "femea"]),
  status: z.enum(["available", "urgent", "adopted"]).default("available"),
  description: z.string().min(10).max(500),
  tags: z.array(z.string().min(2).max(30)).max(8).default([]),
  coverVariant: z.string().min(2).max(40).default("margarida")
})

export const adoptedStorySchema = z.object({
  name: z.string().min(2).max(100),
  title: z.string().min(4).max(120),
  summary: z.string().min(10).max(400),
  adoptionDate: z.string().min(4).max(20),
  coverVariant: z.string().min(2).max(40).default("luna")
})
