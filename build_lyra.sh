mkdir .build && \
cd backend/ && \
swift build -c release && \
cp .build/release/Run ../.build/lyra && \
cd ../frontend/ && \
yarn && \
yarn build && \
yarn export && \
mkdir ../.build/lyra-frontend && \
cp -r out/* ../.build/lyra-frontend && \
echo "Done!"
