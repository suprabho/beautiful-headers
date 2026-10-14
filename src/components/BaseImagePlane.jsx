import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createFittedImageCanvas } from '../lib/backgroundImage'

/**
 * BaseImagePlane - the base image for R3F background types. A plane locked
 * to the camera that exactly fills the view, drawn before the scene's
 * (transparent) foreground and over its background colour/gradient.
 *
 * The image is fitted into a canvas of the viewport's aspect, so the plane
 * shows it undistorted for both perspective and orthographic cameras.
 * `distance` places it along the view direction; it must sit behind every
 * foreground object (and in front of any opaque backdrop mesh).
 */
const BaseImagePlane = ({ backgroundImage, distance }) => {
  const { camera, size, viewport } = useThree()
  const meshRef = useRef()
  const { image, fit, imageOpacity } = backgroundImage

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(createFittedImageCanvas(image, size.width * viewport.dpr, size.height * viewport.dpr, fit))
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [image, fit, size.width, size.height, viewport.dpr])

  useEffect(() => () => texture.dispose(), [texture])

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const d = distance ?? camera.far * 0.9
    mesh.position.copy(camera.position)
    mesh.quaternion.copy(camera.quaternion)
    mesh.translateZ(-d)
    if (camera.isOrthographicCamera) {
      mesh.scale.set((camera.right - camera.left) / camera.zoom, (camera.top - camera.bottom) / camera.zoom, 1)
    } else {
      const h = 2 * d * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) / camera.zoom
      mesh.scale.set(h * camera.aspect, h, 1)
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={imageOpacity}
        depthWrite={false}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}

export default BaseImagePlane
