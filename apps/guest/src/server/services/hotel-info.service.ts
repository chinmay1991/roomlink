import { prisma } from '@/server/db'

/** Guest PRD §21 — entirely backed by Hotel Admin's existing configuration, no hard-coded fields. */
export async function getHotelInfo(hotelId: string) {
  const hotel = await prisma.hotels.findUniqueOrThrow({
    where: { hotel_id: hotelId },
    select: {
      name: true,
      address_line: true,
      city: true,
      state: true,
      country: true,
      pincode: true,
      phone: true,
      email: true,
      check_in_time: true,
      check_out_time: true,
      breakfast_time: true,
      restaurant_time: true,
      hotel_settings: { select: { welcome_message: true, guest_instructions: true, wifi_name: true, wifi_password: true } },
    },
  })

  return hotel
}
