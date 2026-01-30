import { prisma } from '#lib/prisma.ts'


const load = async () => {
    console.log("Clear all flights")
    await prisma.flight.deleteMany()

    const flight1 = await prisma.flight.create({
        data: {
            name: "A-100",
            plannedDeparture: new Date(2023, 1, 1, 1, 0, 0, 0),
        }
    })

    for (let i = 1; i <= 10; i++) {
        await prisma.flight.create({
            data: {
                name: "F-"+i.toString().padStart(3, '0'),
                plannedDeparture: new Date(2023, 1, 1, i, 0, 0, 0),
            }
        })
    }

    console.log("Clear all seats")
    await prisma.seat.deleteMany()


    for (let i = 0; i < 100; i++) {
        await prisma.seat.create({
            data: {
                name: i.toString().padStart(3, '0'),
                flightId: flight1.id
            }
        })
    }
}

void load()
