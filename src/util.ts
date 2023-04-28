import url from "url";
import path from "path";
import logger from "./logger.js";

export const filename = () => url.fileURLToPath(import.meta.url);
export const dirname = () => {
    return path.resolve(path.dirname(filename()), '../src')
};

interface Directions {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
}

export interface ControllerData {
    controller: boolean;
    joystick: number[];
    throttle: number;
    campan: number;
    leg: number;
    arm: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

const OPPOSITES = {
    'up': 'down',
    'left': 'right',
    'right': 'left',
    'down': 'up'
}

export class MovementManager {
    fSpeed: number;
    bSpeed: number;
    tSpeed: number;
    directions: Directions;

    constructor(forwardSpeed = 50, backwardSpeed = 40, turnSpeed = 30) {
        this.directions = {
            up: false, down: false, left: false, right: false
        }
        this.fSpeed = forwardSpeed;
        this.bSpeed = backwardSpeed;
        this.tSpeed = turnSpeed;
    }

    processMovementEvent(direction: Direction, release=false) {
        if (!release) {
            // Skip if opposite key is already pressed
            if (this.directions[ OPPOSITES[direction] as Direction ]) return;
            this.directions[direction] = true;
        } else {
            this.directions[direction] = false;
        }
    }

    processController(data: ControllerData): string[] {
        let commands = [];
        let pleft = 0;
        let pright = 0;
        if (data.controller) {
            const turn = Math.abs(data.joystick[0]) > 10 ? data.joystick[0] : 0;

            pleft += -data.throttle;
            pright += -data.throttle;

            pright -= (turn/100) * this.tSpeed;
            pleft += (turn/100) * this.tSpeed;

            if (pright > 100) pright = 100;
            else if (pright < -100) pright = -100;
            if (pleft > 100) pleft = 100;
            else if (pleft < -100) pleft = -100;

            pright = Math.floor(pright);
            pleft = Math.floor(pleft);

            commands.push(`M,${pright},${pleft}`);
        }

        // logger.debug(commands);
        const camAngle = Math.floor(scale(data.campan > 10 ? data.campan : 0, 0, 100, 155, 85));
        const legAngle = Math.floor(scale(data.leg, 0, 100, 10, 180));
        const armAngle = data.arm;
        commands.push(`C,${camAngle}`);
        commands.push(`W,${legAngle}`);
        commands.push(`K,${armAngle}`);

        return commands;
    }

    getCommand() {
        let sideA = 0;
        let sideB = 0;
        if (this.directions.up) {
            sideA -= this.fSpeed;
            sideB -= this.fSpeed;
        } else if (this.directions.down) {
            sideA += this.bSpeed;
            sideB += this.bSpeed;
        }

        if (this.directions.right) {
            sideA -= this.tSpeed;
            sideB += this.tSpeed;
        } else if (this.directions.left) {
            sideA += this.tSpeed;
            sideB -= this.tSpeed;
        }

        return `M,${sideA},${sideB}`
    }
}

export function scale (n: number, inMin: number, inMax: number, outMin: number, outMax: number) {
    return (n - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}
