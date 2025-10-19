import {
  Engine,
  Scene,
  LoadAssetContainerAsync,
  SceneInstrumentation,
  Animation,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import {
  ShowInspector,
  IShellService,
  ShellServiceIdentity,
  ISceneContext,
  SceneContextIdentity,
  useResource,
  usePollingObservable,
  useObservableState,
} from "@babylonjs/inspector";
import { useCallback } from "react";
import { Badge } from "@fluentui/react-components";

// First we need to configure a ServiceDefinition.
const MemoryCounterServiceDefinition: ServiceDefinition<
  [],
  // We consume IShellService so we can add a new side pane,
  // and also ISceneContext to get access to the current scene.
  // These are the service contracts (an interface) and are used at compile time.
  [IShellService, ISceneContext]
> = {
  friendlyName: "Memory Counter",
  // These are consumed service identities and are used at runtime.
  consumes: [ShellServiceIdentity, SceneContextIdentity],
  // This factory function creates the instance of the service.
  // It is effectively called when ShowInspector is called.
  factory: (shellService: IShellService, sceneContext: ISceneContext) => {
    const MemoryCounter: FunctionComponent<{ scene: Scene }> = ({ scene }) => {
      const getMemoryUsage = () => {
        if ("memory" in performance) {
          return {
            bytes: (performance as any).memory.usedJSHeapSize,
            source: "legacy",
            breakdown: [],
          };
        }
        // No memory data available
        return {
          bytes: 0,
          source: "unavailable",
          breakdown: [],
        };
      };

      return (
        <Badge
          style={{ alignSelf: "center" }}
          size="medium"
          appearance="tint"
          color={
            getMemoryUsage().source == "unavailable" ? "danger" : "success"
          }
        >
          {"Memory: " +
            (Math.round(getMemoryUsage().bytes / 1024) / 1024).toFixed(0) +
            " Mb"}
        </Badge>
      );
    };

    const toolbarItemRegistration = shellService.addToolbarItem({
      key: "Memory Counter",
      horizontalLocation: "right",
      verticalLocation: "bottom",
      // This is the React component that will be rendered in the side pane.
      component: () => {
        // Create a scene state that updates whenever the current scene updates.
        const scene = useObservableState(
          () => sceneContext.currentScene,
          sceneContext.currentSceneObservable
        );
        // Render the MemoryCounter, but only if we have a current scene.
        return scene ? <MemoryCounter scene={scene} /> : null;
      },
    });

    return toolbarItemRegistration;
  },
};

const testAsset = "https://playground.babylonjs.com/scenes/BoomBox.glb";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;

const engine = new Engine(canvas, true, {
  adaptToDeviceRatio: true,
  antialias: true,
});

const scene = new Scene(engine);

(async () => {
  scene.createDefaultCameraOrLight(true, true, true);
  const assetContainer = await LoadAssetContainerAsync(testAsset, scene);
  assetContainer.addAllToScene();
  const camera = scene.activeCamera;
  camera.alpha = Math.PI / 4;
  camera.radius = 0.2;

  engine.runRenderLoop(() => {
    scene.render();
  });

  setTimeout(() => {
    ShowInspector(scene, {
      serviceDefinitions: [MemoryCounterServiceDefinition],
    });
  }, 1000);
})();
