-- Allow null midpoints; frontend computes defaults on render
ALTER TABLE `Connections`
  MODIFY `controlDotX` INT NULL,
  MODIFY `controlDotY` INT NULL;
