const express = require('express')
const { PrismaClient } = require('@prisma/client')
const authorize = require('../middleware/authorize')

const router = express.Router()
const prisma = new PrismaClient()

// All routes require a valid JWT
router.use(authorize)

// GET all notes for logged-in user
router.get('/', async (req, res) => {
    try {
        const notes = await prisma.note.findMany({
            where: { author_id: req.authUser.sub },
            orderBy: { created_at: 'desc' }
        })
        res.json(notes)
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: "Failed to fetch notes" })
    }
})

// GET one note by ID
router.get('/:id', async (req, res) => {
    try {
        const note = await prisma.note.findUnique({
            where: { id: Number(req.params.id) }
        })
        if (!note) return res.status(404).json({ msg: "Note not found" })
        if (note.author_id !== req.authUser.sub) return res.status(403).json({ msg: "Access denied" })

        res.json(note)
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: "Error fetching note" })
    }
})

// POST - create new note
router.post('/', async (req, res) => {
    try {
        if (!req.body.note) return res.status(400).json({ msg: "Note content is required" })

        const note = await prisma.note.create({
            data: {
                note: req.body.note,
                author_id: req.authUser.sub,
                created_at: new Date(),
                updated_at: new Date(),
                x: req.body.x,
                y: req.body.y
            }
        })
        res.status(201).json({ msg: "Note created", note })
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: "Failed to create note" })
    }
})

// PUT - update existing note
router.put('/:id', async (req, res) => {
    try {
        const note = await prisma.note.findUnique({ where: { id: Number(req.params.id) } })
        if (!note) return res.status(404).json({ msg: "Note not found" })
        if (note.author_id !== req.authUser.sub) return res.status(403).json({ msg: "Access denied" })

        const updated = await prisma.note.update({
            where: { id: note.id },
            data: {
                note: req.body.note || note.note,
                updated_at: new Date()
            }
        })
        res.json({ msg: "Note updated", note: updated })
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: "Failed to update note" })
    }
})

// DELETE - remove a note
router.delete('/:id', async (req, res) => {
    try {
        const note = await prisma.note.findUnique({ where: { id: Number(req.params.id) } })
        if (!note) return res.status(404).json({ msg: "Note not found" })
        if (note.author_id !== req.authUser.sub) return res.status(403).json({ msg: "Access denied" })

        await prisma.note.delete({ where: { id: note.id } })
        res.json({ msg: "Note deleted" })
    } catch (err) {
        console.error(err)
        res.status(500).json({ msg: "Failed to delete note" })
    }
})

module.exports = router
