export type SceneActor = "doyun" | "juno" | "gray_wraith";
export type ActorZone = "left" | "center" | "right";
export type ActorScale = "small" | "medium" | "large";
export type ActorFacing = "screen-left" | "screen-right" | "front";
export type DramaticSide = "enemy" | "hero";
export type MirrorPolicy = "safe-to-mirror" | "original-only";
export type SupportAnchor = "center-low-support" | "center-mid-support";
export type SceneRenderMode = "sprite" | "cut";
export type SceneCompositionPreset =
  | "conversation"
  | "confrontation"
  | "protect"
  | "battle"
  | "solo-cut"
  | "ending";

export interface ActorPlacement {
  readonly zone: ActorZone;
  readonly scale: ActorScale;
  readonly anchor?: SupportAnchor;
  readonly dramaticSide: DramaticSide;
  readonly facing: ActorFacing;
  readonly mirrorPolicy: MirrorPolicy;
}

export interface CutPresentation {
  readonly stage: "full-stage";
  readonly objectFit: "cover";
}

export interface SceneComposition {
  readonly preset: SceneCompositionPreset;
  readonly mode: SceneRenderMode;
  readonly actors: Partial<Record<SceneActor, ActorPlacement>>;
  readonly cutPresentation?: CutPresentation;
}

const compositions: Record<SceneCompositionPreset, SceneComposition> = {
  conversation: {
    preset: "conversation",
    mode: "sprite",
    actors: {
      juno: {
        zone: "left",
        scale: "small",
        dramaticSide: "hero",
        facing: "front",
        mirrorPolicy: "original-only",
      },
      doyun: {
        zone: "right",
        scale: "large",
        dramaticSide: "hero",
        facing: "screen-left",
        mirrorPolicy: "original-only",
      },
    },
  },
  confrontation: {
    preset: "confrontation",
    mode: "sprite",
    actors: {
      gray_wraith: {
        zone: "left",
        scale: "large",
        dramaticSide: "enemy",
        facing: "screen-right",
        mirrorPolicy: "safe-to-mirror",
      },
      juno: {
        zone: "center",
        scale: "small",
        anchor: "center-low-support",
        dramaticSide: "hero",
        facing: "front",
        mirrorPolicy: "original-only",
      },
      doyun: {
        zone: "right",
        scale: "large",
        dramaticSide: "hero",
        facing: "screen-left",
        mirrorPolicy: "original-only",
      },
    },
  },
  protect: {
    preset: "protect",
    mode: "sprite",
    actors: {
      gray_wraith: {
        zone: "left",
        scale: "large",
        dramaticSide: "enemy",
        facing: "screen-right",
        mirrorPolicy: "safe-to-mirror",
      },
      juno: {
        zone: "center",
        scale: "medium",
        anchor: "center-mid-support",
        dramaticSide: "hero",
        facing: "front",
        mirrorPolicy: "original-only",
      },
      doyun: {
        zone: "right",
        scale: "large",
        dramaticSide: "hero",
        facing: "screen-left",
        mirrorPolicy: "original-only",
      },
    },
  },
  battle: {
    preset: "battle",
    mode: "sprite",
    actors: {
      gray_wraith: {
        zone: "left",
        scale: "large",
        dramaticSide: "enemy",
        facing: "screen-right",
        mirrorPolicy: "safe-to-mirror",
      },
      juno: {
        zone: "center",
        scale: "small",
        anchor: "center-mid-support",
        dramaticSide: "hero",
        facing: "front",
        mirrorPolicy: "original-only",
      },
      doyun: {
        zone: "right",
        scale: "large",
        dramaticSide: "hero",
        facing: "screen-left",
        mirrorPolicy: "original-only",
      },
    },
  },
  "solo-cut": {
    preset: "solo-cut",
    mode: "cut",
    actors: {},
    cutPresentation: {
      stage: "full-stage",
      objectFit: "cover",
    },
  },
  ending: {
    preset: "ending",
    mode: "sprite",
    actors: {
      juno: {
        zone: "left",
        scale: "small",
        dramaticSide: "hero",
        facing: "front",
        mirrorPolicy: "original-only",
      },
      doyun: {
        zone: "right",
        scale: "large",
        dramaticSide: "hero",
        facing: "screen-left",
        mirrorPolicy: "original-only",
      },
    },
  },
};

export function compositionByPreset(
  preset: SceneCompositionPreset,
): SceneComposition {
  return compositions[preset];
}

export function compositionForContext(context: string): SceneComposition {
  if (context.includes("cut-01") || context.includes("cut-02")) {
    return compositions["solo-cut"];
  }
  if (context === "n3_wraith_choice" || context.startsWith("n4_")) {
    return compositions.confrontation;
  }
  if (context === "n5_transform_result") {
    return {
      ...compositions.protect,
      actors: {
        ...compositions.protect.actors,
        juno: {
          ...compositions.protect.actors.juno!,
          anchor: "center-low-support",
        },
      },
    };
  }
  if (context === "n5_transform") {
    return compositions.protect;
  }
  if (
    context === "battle_wraith" ||
    context === "n6_first_choice" ||
    context === "n7_gray_answer" ||
    context === "n8_final_spell"
  ) {
    return compositions.battle;
  }
  if (context.startsWith("ending_") || context === "post_credit") {
    return compositions.ending;
  }
  return compositions.conversation;
}

export function findCompositionViolations(
  composition: SceneComposition,
): string[] {
  if (composition.mode === "cut" && Object.keys(composition.actors).length > 0) {
    return ["cut mode cannot contain live actors"];
  }
  const occupied = new Map<ActorZone, SceneActor>();
  const violations: string[] = [];
  for (const [actor, placement] of Object.entries(composition.actors) as Array<
    [SceneActor, ActorPlacement]
  >) {
    const prior = occupied.get(placement.zone);
    if (prior) violations.push(`${prior}/${actor} share ${placement.zone}`);
    else occupied.set(placement.zone, actor);
  }
  return violations;
}
