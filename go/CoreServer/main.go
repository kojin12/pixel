package main

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type Room struct {
	RoomID string
	Users  map[string]*websocket.Conn
}

func main() {

	coreSrever := fiber.New()

	coreSrever.Listen(":3000")

}
