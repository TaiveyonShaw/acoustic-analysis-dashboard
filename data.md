# Understanding the Matlab Data

Assumptions being made:
- The values in the rawILD and rawITD is the difference of loudness and time delay between the two hearing aid respectively.
- Negative values assumes left while positive assumes right.
- Read somewhere that stated that, "the maximum physical delay across a human head is roughly 650 μs to 700 μs (about 0.7 ms)." Assuming this and some of the data, outlier detection can be set to 800μs.
- Physical Outliers (Hard Bounds): The human head cannot physically create a shadow effect greater than about 20.0 to 25.0 dB, even at very high frequencies (>10,000 Hz). Any value outside of \([-25.0, 25.0]\text{ dB}\) is an experimental error or equipment glitch.
- Statistical Outliers (Contextual): At low frequencies (e.g., 500 Hz), the physical maximum ILD is close to 0.0 dB because long wavelengths wrap around the head. A measured ILD of 8.0 dB at 500 Hz is a statistical outlier, even though it is well below the absolute physical maximum of 25.0 dB.