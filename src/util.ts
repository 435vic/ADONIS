import url from "url";
import path from "path";

export const filename = () => url.fileURLToPath(import.meta.url)
export const dirname = () => path.dirname(filename())

interface Directions {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
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
            sideA += this.tSpeed;
            sideB -= this.tSpeed;
        } else if (this.directions.left) {
            sideA -= this.tSpeed;
            sideB += this.tSpeed;
        }

        return `M,${sideA},${sideB}`
    }
}
