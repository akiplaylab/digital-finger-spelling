function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createSequencePlayer({
  getStepMs,
  getRunItems,
  onStart,
  onStep,
  onComplete,
  onStopped,
  onEmpty,
}) {
  let animationRunId = 0;

  async function play() {
    const { items, unknown } = getRunItems();

    if (!items.length) {
      onEmpty();
      return;
    }

    animationRunId += 1;
    const runId = animationRunId;
    const stepMs = getStepMs();

    onStart({ items, unknown });

    for (const item of items) {
      if (runId !== animationRunId) return;
      onStep(item);
      await wait(stepMs);
    }

    if (runId === animationRunId) {
      onComplete({ items, unknown });
    }
  }

  function stop() {
    animationRunId += 1;
    onStopped();
  }

  return {
    play,
    stop,
  };
}
